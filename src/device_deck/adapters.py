import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import threading
import time
import urllib.request


# Sent on stdin to an explicit remote /bin/sh, so it never depends on the account's login shell
# (fish, csh/tcsh on pfSense/OPNsense, ...). Keep it POSIX sh.
SSH_PROBE = r"""os=$(uname -s)
printf '__DD_ID__\n'; uname -n; id -un; printf '%s\n' "$os"; uname -r
printf '__DD_VERSION__\n'
case "$os" in
  Darwin) sw_vers ;;
  FreeBSD) printf 'FREEBSD_VERSION=%s\n' "$(freebsd-version 2>/dev/null || uname -r)" ;;
  *) if test -r /etc/os-release; then awk -F= '/^(PRETTY_NAME|OS_VERSION|VERSION_ID)=/{print}' /etc/os-release; fi ;;
esac
printf '__DD_MEMORY__\n'
case "$os" in
  Darwin) sysctl -n hw.memsize; vm_stat ;;
  FreeBSD) sysctl hw.physmem hw.pagesize vm.stats.vm.v_free_count vm.stats.vm.v_inactive_count vm.stats.vm.v_active_count vm.stats.vm.v_wire_count kstat.zfs.misc.arcstats.size 2>/dev/null ;;
  *) awk '/^(MemTotal|MemAvailable|MemFree|Cached|Buffers|SwapTotal|SwapFree):/{print}' /proc/meminfo ;;
esac
printf '__DD_DISK__\n'
case "$os" in
  Darwin) df -Pk / /System/Volumes/Data ;;
  *) df -Pk ;;
esac
printf '__DD_SWAP__\n'
case "$os" in
  Darwin) sysctl vm.swapusage ;;
  FreeBSD) swapinfo -k 2>/dev/null ;;
  *) cat /proc/swaps ;;
esac
printf '__DD_MOUNTS__\n'
case "$os" in
  FreeBSD) mount -p | awk '{print $2, $3, $4}' ;;
  *) if test -r /proc/mounts; then awk '{print $2, $3, $4}' /proc/mounts; fi ;;
esac
printf '__DD_END__\n'
"""

OUTPUT_LIMIT = 262144
STDERR_LIMIT = 65536


class ProbeFailure(Exception):
    def __init__(self, status, detail):
        self.status, self.detail = status, detail


def _drain(stream, limit, chunks, overflow):
    size = 0
    while chunk := os.read(stream.fileno(), 65536):
        if size < limit:
            chunks.append(chunk[:limit-size])
        size += len(chunk)
        if overflow is not None and size > limit:
            overflow.set()
            return


def _feed(stream, data):
    try:
        stream.write(data)
        stream.close()
    except (BrokenPipeError, OSError):
        pass


def run(args, timeout=16, input=None):
    """Run a fixed client command. Output is read incrementally and the client is killed past
    OUTPUT_LIMIT, so a misbehaving device cannot make this process buffer unbounded data."""
    try:
        process = subprocess.Popen(args, stdin=subprocess.PIPE if input is not None else subprocess.DEVNULL,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError:
        raise ProbeFailure("dependency_missing", "Required client is not installed: " + args[0])
    out, err, overflow = [], [], threading.Event()
    readers = [threading.Thread(target=_drain, args=(process.stdout, OUTPUT_LIMIT, out, overflow), daemon=True),
               threading.Thread(target=_drain, args=(process.stderr, STDERR_LIMIT, err, None), daemon=True)]
    threads = readers + ([threading.Thread(target=_feed, args=(process.stdin, input.encode()), daemon=True)]
                         if input is not None else [])
    for thread in threads:
        thread.start()
    deadline = time.monotonic() + timeout
    failure = None
    try:
        while any(r.is_alive() for r in readers) or process.poll() is None:
            if overflow.is_set():
                failure = ProbeFailure("invalid_response", "Device response exceeded the probe limit")
                break
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                failure = ProbeFailure("timeout", "Connection or device response timed out")
                break
            overflow.wait(min(remaining, 0.05))
    finally:
        if process.poll() is None:
            process.kill()
        process.wait()
        for thread, stream in zip(threads, (process.stdout, process.stderr, process.stdin)):
            thread.join(timeout=1)
            if not thread.is_alive() and stream and not stream.closed:
                stream.close()
    if failure:
        raise failure
    if process.returncode:
        error = b"".join(err).decode("utf-8", "replace").lower()
        if "host key verification failed" in error or "remote host identification has changed" in error:
            raise ProbeFailure("host_key_untrusted", "Verify this host's public-key fingerprint in a trusted terminal")
        if "permission denied" in error or "unauthorized" in error:
            raise ProbeFailure("authentication_failed", "The configured identity or device pairing was rejected")
        if "timed out" in error:
            raise ProbeFailure("timeout", "The selected endpoint did not respond")
        raise ProbeFailure("connection_failed", "The selected client returned a connection error")
    return b"".join(out).decode("utf-8", "replace")


def parse_disks(text):
    rows = []
    for line in text.splitlines():
        parts = line.split(maxsplit=5)
        if len(parts) != 6 or not parts[1].isdigit():
            continue
        source, total, used, available, percent, mount = parts
        if source.startswith("/dev/loop") or not (source.startswith("/dev/") or mount == "/"):
            continue
        rows.append({"mount": mount, "total_bytes": int(total)*1024, "used_bytes": int(used)*1024,
                     "available_bytes": int(available)*1024, "used_percent": int(percent.rstrip("%"))})
    return rows


def parse_linux_memory(text):
    fields = {name: int(value)*1024 for name, value in re.findall(r"^(\w+):\s+(\d+)\s+kB", text, re.M)}
    total, available = fields.get("MemTotal"), fields.get("MemAvailable")
    return {"total_bytes": total, "available_bytes": available, "free_bytes": fields.get("MemFree"),
            "used_bytes": total-available if total is not None and available is not None else None,
            "cache_bytes": fields.get("Cached", 0)+fields.get("Buffers", 0) if "Cached" in fields or "Buffers" in fields else None,
            "swap_total_bytes": fields.get("SwapTotal"),
            "swap_used_bytes": fields["SwapTotal"]-fields["SwapFree"] if "SwapTotal" in fields and "SwapFree" in fields else None}


def parse_freebsd_memory(text, swap):
    fields = {name: int(value) for name, value in re.findall(r"^([\w.]+):\s+(\d+)\s*$", text, re.M)}
    page = fields.get("hw.pagesize", 4096)
    pages = lambda name: fields[name]*page if name in fields else None
    free, inactive = pages("vm.stats.vm.v_free_count"), pages("vm.stats.vm.v_inactive_count")
    active, wired = pages("vm.stats.vm.v_active_count"), pages("vm.stats.vm.v_wire_count")
    devices = []
    for line in swap.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 4 and parts[0] != "Total" and parts[1].isdigit() and parts[2].isdigit():
            devices.append({"kind": "disk", "total_bytes": int(parts[1])*1024, "used_bytes": int(parts[2])*1024})
    return {"total_bytes": fields.get("hw.physmem"), "free_bytes": free,
            "available_bytes": free+inactive if free is not None and inactive is not None else None,
            "used_bytes": active+wired if active is not None and wired is not None else None,
            "cache_bytes": fields.get("kstat.zfs.misc.arcstats.size"),
            "swap_total_bytes": sum(d["total_bytes"] for d in devices) if devices else None,
            "swap_used_bytes": sum(d["used_bytes"] for d in devices) if devices else None,
            "swap_devices": devices}


def parse_ssh(text):
    sections = {}
    current = None
    for line in text.splitlines():
        if re.fullmatch(r"__DD_[A-Z]+__", line):
            current = line
            sections[current] = []
        elif current:
            sections[current].append(line)
    identity = sections.get("__DD_ID__", [])
    if len(identity) != 4 or identity[2] not in ("Darwin", "Linux", "FreeBSD"):
        raise ProbeFailure("invalid_response", "Unsupported or incomplete system identity")
    system = {"hostname": identity[0], "username": identity[1], "platform": identity[2], "kernel": identity[3]}
    version = "\n".join(sections.get("__DD_VERSION__", []))
    memory_text = "\n".join(sections.get("__DD_MEMORY__", []))
    swap = "\n".join(sections.get("__DD_SWAP__", []))
    if identity[2] == "Darwin":
        for key, name in [("ProductName", "name"), ("ProductVersion", "version"), ("BuildVersion", "build")]:
            match = re.search(key+r":\s*(.+)", version)
            system[name] = match[1] if match else None
        total_match = re.match(r"(\d+)", memory_text)
        page_match = re.search(r"page size of (\d+) bytes", memory_text)
        page_size = int(page_match[1]) if page_match else 4096
        page_fields = {k: int(v)*page_size for k, v in re.findall(r"^([^:\n]+):\s+(\d+)\.", memory_text, re.M)}
        used = sum(page_fields.get(k, 0) for k in ("Anonymous pages", "Pages wired down", "Pages occupied by compressor"))
        match = re.search(r"used\s*=\s*([\d.]+)M", swap)
        memory = {"total_bytes": int(total_match[1]) if total_match else None, "used_bytes": used or None,
                  "free_bytes": page_fields.get("Pages free"), "available_bytes": None,
                  "cache_bytes": page_fields.get("File-backed pages"),
                  "swap_used_bytes": int(float(match[1])*1024**2) if match else None}
    elif identity[2] == "FreeBSD":
        match = re.search(r"^FREEBSD_VERSION=(.+)$", version, re.M)
        system.update(name="FreeBSD", version=match[1].strip() if match else None)
        memory = parse_freebsd_memory(memory_text, swap)
    else:
        for key, name in [("PRETTY_NAME", "name"), ("VERSION_ID", "version"), ("OS_VERSION", "firmware")]:
            match = re.search(r"^"+key+r"=(.+)$", version, re.M)
            system[name] = match[1].strip('"') if match else None
        memory = parse_linux_memory(memory_text)
        devices = []
        for line in swap.splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 4 and parts[2].isdigit():
                devices.append({"kind": "zram" if parts[0].startswith("/dev/zram") else "disk",
                                "total_bytes": int(parts[2])*1024, "used_bytes": int(parts[3])*1024})
        memory["swap_devices"] = devices
    disks = parse_disks("\n".join(sections.get("__DD_DISK__", [])))
    mounts = {}
    for line in sections.get("__DD_MOUNTS__", []):
        parts = line.split()
        if len(parts) == 3:
            mounts[parts[0]] = (parts[1], parts[2].split(","))
    for disk in disks:
        filesystem, flags = mounts.get(disk["mount"], (None, []))
        disk["filesystem_type"] = filesystem
        disk["read_only"] = "ro" in flags or filesystem == "squashfs"
    return {"system": system, "memory": memory, "disks": disks}


def ssh_args(endpoint, credential, interactive=False):
    args = ["ssh"]
    if not interactive:
        args += ["-o", "BatchMode=yes", "-o", "PasswordAuthentication=no", "-o", "KbdInteractiveAuthentication=no"]
    args += ["-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=5", "-p", str(endpoint.port)]
    if credential.method == "ssh_key":
        args += ["-o", "IdentitiesOnly=yes", "-i", str(Path(credential.key_path).expanduser())]
    elif credential.method == "ssh_agent":
        args += ["-o", "IdentitiesOnly=no"]
    if endpoint.host_key_alias:
        args += ["-o", "HostKeyAlias="+endpoint.host_key_alias]
    if endpoint.ssh_alias:
        args += [endpoint.ssh_alias]
    else:
        args += [endpoint.username+"@"+endpoint.host]
    return args


def probe_ssh(device, endpoint, credential):
    if credential.method == "password":
        raise ProbeFailure("interactive_required", "Password login is registered; sign in manually in a trusted terminal")
    if endpoint.ssh_alias:
        config = run(["ssh", "-G", endpoint.ssh_alias], timeout=5)
        pairs = dict(line.split(" ", 1) for line in config.splitlines() if " " in line)
        if (pairs.get("hostname"), pairs.get("user"), pairs.get("port")) != (endpoint.host, endpoint.username, str(endpoint.port)):
            raise ProbeFailure("configuration_mismatch", "SSH alias does not match the registered address and account")
    data = parse_ssh(run(ssh_args(endpoint, credential)+["/bin/sh", "-s"], input=SSH_PROBE))
    if data["system"]["username"] != endpoint.username:
        raise ProbeFailure("identity_mismatch", "Connected account does not match the registered account")
    if device.expected_hostname and data["system"]["hostname"] != device.expected_hostname:
        raise ProbeFailure("identity_mismatch", "Connected machine name does not match the registered device")
    return data, bool(device.expected_hostname)


def probe_adb(device, endpoint, credential):
    prefix = ["adb", "-s", endpoint.serial]
    state = run(prefix+["get-state"], timeout=6).strip()
    if state != "device":
        raise ProbeFailure("pairing_required", "Unlock the phone and authorize this computer or complete wireless pairing")
    def prop(name):
        return run(prefix+["shell", "getprop", name], timeout=6).strip()[:200]
    name, version = prop("ro.product.model"), prop("ro.build.version.release")
    memory = parse_linux_memory(run(prefix+["shell", "cat", "/proc/meminfo"], timeout=6))
    disks = parse_disks(run(prefix+["shell", "df", "-k", "/data"], timeout=6))
    return {"system": {"name": "Android", "version": version, "hostname": name, "platform": "Android"},
            "memory": memory, "disks": disks}, True


def probe_ios_usb(device, endpoint, credential):
    ids = run(["idevice_id", "-l"], timeout=6).splitlines()
    if endpoint.serial not in ids:
        raise ProbeFailure("not_connected", "Registered iOS UDID is not connected through trusted USB")
    def info(key):
        return run(["ideviceinfo", "-u", endpoint.serial, "-k", key], timeout=6).strip()[:200]
    return {"system": {"name": "iOS", "version": info("ProductVersion"), "hostname": info("DeviceName"),
                       "model": info("ProductType"), "platform": "iOS"}, "memory": None, "disks": None}, True


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def probe_wda(device, endpoint, credential):
    host = "["+endpoint.host+"]" if ":" in endpoint.host else endpoint.host
    url = f"http://{host}:{endpoint.port}/status"
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        with opener.open(url, timeout=6) as response:
            body = response.read(262145)
        if len(body) > 262144:
            raise ValueError("Response too large")
        value = json.loads(body).get("value", {})
        os_info = value.get("os", {})
        if not isinstance(value, dict) or not isinstance(os_info, dict) or "ios" not in str(os_info.get("name", "")).lower():
            raise ValueError("Not an iOS WDA status response")
    except Exception:
        raise ProbeFailure("wda_unavailable", "Existing WDA /status endpoint was unavailable or did not identify iOS")
    return {"system": {"name": "iOS / WebDriverAgent", "version": str(os_info.get("version", ""))[:100],
                       "platform": "iOS"}, "memory": None, "disks": None}, False


ADAPTERS = {"ssh": probe_ssh, "adb": probe_adb, "ios_usb": probe_ios_usb, "wda": probe_wda}


def plan(endpoint, credential):
    notes = []
    if endpoint.protocol == "ssh":
        command = shlex.join(ssh_args(endpoint, credential, interactive=True))
        notes = ["Use a trusted terminal. Unknown host keys require independent fingerprint verification."]
        if credential.method == "password":
            notes += ["Enter the password interactively; DeviceDeck does not retrieve or store it."]
    elif endpoint.protocol == "adb":
        command = shlex.join(["adb", "-s", endpoint.serial, "get-state"])
        notes = ["Enable USB debugging and approve this computer on the unlocked phone."]
        if endpoint.network != "usb":
            notes += ["Pair wireless debugging interactively with adb pair HOST:PAIRING_PORT; pairing and connection ports may differ.",
                      "Then connect with adb connect HOST:CONNECTION_PORT. DeviceDeck does not pair or open debugging ports."]
    elif endpoint.protocol == "ios_usb":
        command = shlex.join(["ideviceinfo", "-u", endpoint.serial, "-k", "ProductVersion"])
        notes = ["Install libimobiledevice; connect by USB and tap Trust on the unlocked iPhone/iPad.",
                 "Trust is not equivalent to app automation; WDA needs a separate developer setup."]
    else:
        host = "["+endpoint.host+"]" if ":" in endpoint.host else endpoint.host
        command = shlex.join(["curl", f"http://{host}:{endpoint.port}/status"])
        notes = ["Use an existing, signed WebDriverAgent deployment on a trusted network.",
                 "DeviceDeck only reads status; it does not install WDA or perform UI actions."]
    return {"protocol": endpoint.protocol, "command": command, "steps": notes,
            "auth_method": credential.method, "credential_ref": credential.id}
