import ipaddress
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator


Identifier = str


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Credential(StrictModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    name: str = Field(min_length=1, max_length=100)
    method: Literal["ssh_key", "ssh_agent", "password", "adb_pairing", "ios_trust", "wda_access"]
    key_path: str | None = Field(default=None, max_length=500)
    vault_ref: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def valid_reference(self):
        if self.vault_ref and not re.fullmatch(r"(?:keychain|credential-manager|secret-service|1password|bitwarden|external-vault):[A-Za-z0-9_./@#%-]{1,160}", self.vault_ref):
            raise ValueError("vault_ref must be a supported provider:reference identifier, never a password")
        if self.method == "ssh_key" and not self.key_path:
            raise ValueError("ssh_key requires an external key_path")
        if self.key_path and self.method != "ssh_key":
            raise ValueError("key_path is only valid for ssh_key")
        if self.key_path and ("\n" in self.key_path or not self.key_path.startswith(("/", "~/"))):
            raise ValueError("key_path must be an absolute or ~/ path")
        return self


class Endpoint(StrictModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    network: Literal["lan", "tailscale", "remote", "usb"] = "lan"
    protocol: Literal["ssh", "adb", "ios_usb", "wda"] = "ssh"
    host: str | None = Field(default=None, max_length=253)
    port: int = Field(default=22, ge=1, le=65535)
    username: str | None = Field(default=None, pattern=r"^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$")
    credential_id: str
    ssh_alias: str | None = Field(default=None, pattern=r"^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$")
    host_key_alias: str | None = Field(default=None, max_length=253)
    serial: str | None = Field(default=None, pattern=r"^[A-Za-z0-9][A-Za-z0-9_.:\[\]-]{0,127}$")
    note: str = Field(default="", max_length=500)

    @field_validator("host", "host_key_alias")
    @classmethod
    def validate_host(cls, value):
        if value is None:
            return value
        try:
            ipaddress.ip_address(value)
        except ValueError:
            if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?", value):
                raise ValueError("Use an IP address or hostname, without scheme, path or options")
        return value

    @model_validator(mode="after")
    def connection_requirements(self):
        if self.protocol in ("ssh", "wda") and not self.host:
            raise ValueError("This protocol requires a host")
        if self.protocol == "ssh" and not self.username:
            raise ValueError("SSH requires a username")
        if self.protocol in ("adb", "ios_usb") and not self.serial:
            raise ValueError("Mobile transports require an explicit serial/UDID")
        if self.protocol == "ios_usb" and self.network != "usb":
            raise ValueError("ios_usb uses the usb network type")
        return self


class Device(StrictModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    name: str = Field(min_length=1, max_length=100)
    kind: Literal["computer", "nas", "router", "android", "ios", "server"]
    expected_hostname: str | None = Field(default=None, max_length=200)
    tags: list[str] = Field(default_factory=list, max_length=20)
    endpoints: list[Endpoint] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def unique_endpoints(self):
        if len({e.id for e in self.endpoints}) != len(self.endpoints):
            raise ValueError("Endpoint IDs must be unique within a device")
        return self


class Inventory(StrictModel):
    credentials: list[Credential] = Field(default_factory=list, max_length=1000)
    devices: list[Device] = Field(default_factory=list, max_length=1000)

    @model_validator(mode="after")
    def unique_ids(self):
        for records in [self.credentials, self.devices]:
            if len({r.id for r in records}) != len(records):
                raise ValueError("Duplicate IDs in inventory")
        return self
