'use strict';

// DeviceDeck local console. Plain DOM, no build step, no inline styles or scripts (strict CSP).

const STRINGS = {
  zh: {
    navDevices: '设备', navAccess: '登录方式', navActivity: '接入与活动', loopback: '仅本机 127.0.0.1',
    cancel: '取消', save: '保存', close: '关闭', edit: '编辑', remove: '删除', copy: '复制', copied: '已复制',
    devicesTitle: '设备', devicesLead: '每台设备的全部入口、登录方式和最后一次检查结果。状态只代表采集时刻，不代表现在在线。',
    addDevice: '＋ 添加设备', probeAll: '检查全部', probing: '检查中…', search: '搜索名称、ID、地址、序列号或标签',
    tileAll: '全部设备', tileVerified: '已验证', tileAttention: '需要处理', tileUnchecked: '尚未检查',
    tileAllHint: '{n} 个入口', tileVerifiedHint: '身份已核对', tileAttentionHint: '有入口需人工处理', tileUncheckedHint: '还没有采集记录',
    colEndpoint: '入口', colAddress: '地址 / 序列号', colAuth: '登录方式', colStatus: '状态', colChecked: '采集时间', colActions: '操作',
    probe: '检查', plan: '连接说明', endpointsSummary: '{n} 个入口', noMatch: '没有符合条件的设备。',
    emptyTitle: '还没有设备', emptyText: '先登记一种登录方式（只记类型和位置，不存密码），再添加第一台设备。', emptyAction: '登记登录方式',
    detailEmpty: '选择一台设备查看详情。', facts: '基本信息', deviceId: '设备 ID', kind: '类型', expectedHostname: '预期机器名', tags: '标签',
    os: '系统', source: '数据来源', unknown: '未知', memory: '内存', disk: '磁盘', swap: '交换', available: '可用', free: '空闲', readOnly: '只读',
    noMetrics: '还没有成功的资源采样。', todo: '待处理', allClear: '所有入口最近一次检查都通过了。', editDevice: '编辑设备', probeDevice: '检查此设备的全部入口',
    probeDone: '{name} · {status}', probeAllDone: '已检查 {n} 个入口',
    kinds: { computer: '电脑', nas: 'NAS', router: '路由器', android: 'Android', ios: 'iOS', server: '服务器' },
    networks: { lan: '局域网', tailscale: 'Tailscale', remote: '远程', usb: 'USB' },
    status: {
      verified: '已验证', reachable_unverified: '可达，身份未确认', timeout: '连接超时', authentication_failed: '认证失败',
      host_key_untrusted: '需校验主机公钥', configuration_mismatch: '配置不匹配', identity_mismatch: '设备身份不匹配',
      interactive_required: '需手动登录', dependency_missing: '缺少客户端', pairing_required: '需配对授权', not_connected: '未连接',
      wda_unavailable: 'WDA 不可用', invalid_response: '响应不完整', connection_failed: '连接失败', unchecked: '尚未检查',
    },
    next: {
      reachable_unverified: '能连上，但无法核对设备身份。WDA 只读状态时属于正常情况。',
      timeout: '确认设备开机、和本机在同一网络（或 Tailscale 在线），再重新检查。',
      authentication_failed: '确认私钥文件存在且已加入目标机的 authorized_keys，或 ssh-agent 已解锁。',
      host_key_untrusted: '在可信终端里手动连接一次，独立核对主机公钥指纹后再接受。DeviceDeck 不会自动信任新公钥。',
      configuration_mismatch: 'SSH 别名解析出的地址、用户或端口与登记不一致，修改其中一边让它们一致。',
      identity_mismatch: '连上的机器或账号和登记不一致：可能是 IP 变了、指向了别的设备。核对后再更新登记。',
      interactive_required: '这是密码登录，只能在可信终端里手动输入密码，DeviceDeck 不会代填。',
      dependency_missing: '本机缺少对应客户端（ssh、adb、ideviceinfo 或 curl），安装后再检查。',
      pairing_required: '解锁手机，允许本机的 USB 调试授权，或先完成无线调试配对。',
      not_connected: '设备没有通过 USB 连接，或手机未解锁/未点「信任」。',
      wda_unavailable: 'WebDriverAgent 服务没有运行或端口不对，在开发机上重新启动它。',
      invalid_response: '设备返回的数据不完整或过大，查看下方详情。',
      connection_failed: '连接失败，查看下方详情；必要时在可信终端里手动连接一次。',
      unchecked: '还没有检查过这个入口。',
    },
    editorNew: '添加设备', editorEdit: '编辑设备', identity: '身份', deviceName: '显示名称', idHelp: '小写字母开头，可用 a-z 0-9 _ -，保存后不能改。',
    idTaken: '这个 ID 已被「{name}」使用。换一个 ID，或者去编辑那台设备。', idInvalid: 'ID 必须小写字母开头，只能包含 a-z、0-9、_、-（最多 64 位）。',
    hostnameHelp: 'SSH 检查时会核对远端 hostname，防止 IP 漂移后连错机器。', tagsHelp: '用逗号分隔，最多 20 个。',
    endpoints: '连接入口', addEndpoint: '＋ 添加入口', endpointId: '入口 ID', protocol: '协议', network: '网络', host: 'IP / 主机名', port: '端口',
    username: 'SSH 用户名', serial: '序列号 / UDID', serialHelpAdb: '运行 adb devices 看到的序列号（无线调试时是 IP:端口）。', serialHelpIos: '运行 idevice_id -l 看到的 UDID。',
    hostOptional: 'IP / 主机名（可选）', sshAlias: '现有 SSH 别名（可选）', sshAliasHelp: '设置后用 ~/.ssh/config 里的别名连接，检查时核对它解析出的地址。',
    hostKeyAlias: '主机公钥别名（可选）', credential: '登录方式', noCredential: '没有适用于该协议的登录方式', manageCredentials: '去登记一个',
    note: '备注', removeEndpoint: '移除这个入口', usbOnly: 'iOS USB 只能走 USB。',
    protocols: { ssh: ['SSH', '电脑 / NAS / 路由器'], adb: ['ADB', 'Android'], ios_usb: ['iOS USB', 'iPhone / iPad'], wda: ['WDA', 'iOS 自动化状态'] },
    checks: '保存前检查', checkId: '设备 ID', checkName: '显示名称', checkEndpoint: '入口 {id}', checkHostname: '身份核对',
    ok: '没问题', required: '{field}必填', duplicateEndpoint: '入口 ID 重复', endpointIdInvalid: '入口 ID 格式不对',
    credentialMismatch: '登录方式和协议不匹配', hostnameMissing: '未填预期机器名，SSH 只能核对用户名。', hostnameSet: 'SSH 会同时核对机器名和用户名。',
    preview: '连接命令预览', previewHelp: '手动连接时使用的命令。自动检查会再加上 BatchMode，禁止密码和键盘交互。', previewEmpty: '填完必填项后显示命令。',
    saveDevice: '保存设备', deleteDevice: '删除设备', deleteDeviceTitle: '删除「{name}」？', deleteDeviceText: '会删除这台设备的登记和它保存的检查记录。登录方式和密钥文件不受影响。此操作不能撤销。',
    saved: '已保存', deleted: '已删除', fixErrors: '先处理检查里标红的项目。',
    accessTitle: '登录方式', accessLead: '只登记认证类型和凭据位置。密码、私钥内容和配对码始终留在系统钥匙串、ssh-agent 或手机里。',
    addProfile: '＋ 登记登录方式', colName: '名称', colMethod: '类型', colLocation: '凭据位置', colUsedBy: '被谁使用', unused: '未被使用',
    profileNew: '登记登录方式', profileEdit: '编辑登录方式', profileId: 'ID', profileName: '显示名称', method: '认证类型',
    keyPath: '私钥文件路径', keyPathHelp: '只填路径，例如 ~/.ssh/id_ed25519。私钥内容永远不会被读取或上传。',
    vaultRef: '外部密码库引用（可选）', vaultRefHelp: '形如 keychain:home-nas 或 1password:Servers/nas，只是一个引用，不是密码。',
    deleteProfileTitle: '删除登录方式「{name}」？', deleteProfileText: '只删除这条登记，不会动钥匙串或密钥文件。', inUse: '仍被 {n} 个入口使用，不能删除',
    methods: { ssh_key: 'SSH 私钥', ssh_agent: 'ssh-agent', password: '密码（手动输入）', adb_pairing: 'ADB 配对', ios_trust: 'iOS 信任', wda_access: 'WDA 访问' },
    planTitle: '连接方案', planPick: '选择入口', planDevice: '设备', planEndpoint: '入口', lastStatus: '最近状态', planSteps: '注意事项',
    planEmpty: '在设备页点「连接说明」，或在这里选择一个入口。', authMethod: '认证类型', credentialRef: '登录方式 ID',
    activityTitle: '接入与活动', activityLead: '日常直接问 Agent 就行，不用打开控制台。这一页确认 Agent 是否接好，并记录网页、命令行和 Agent 的每次登记、检查和删除，不记录任何密码。',
    actorAll: '全部', actors: { web: '网页', cli: '命令行', mcp: 'Agent' }, latestN: '最近 {n} 条', noEvents: '还没有活动记录。',
    actions: { inventory_upsert: '保存登记', probe: '检查', device_delete: '删除设备', credential_delete: '删除登录方式' },
    agents: 'Agent 接入', agentsLead: 'MCP 让 Agent 能读清单、取连接方案、做只读检查；Skill 告诉它什么时候该查、怎么帮你登记设备。两样都装好后，直接问「NAS 磁盘还剩多少」就行。',
    agentName: { claude: 'Claude Code', codex: 'Codex' }, skillState: { linked: '已安装', other: '已安装（另一份副本）', missing: '未安装', broken: '链接失效', conflict: '同名目录冲突' },
    installSkill: '安装或修复 Skill', restartHint: '装好后重开一个 Agent 会话，新的 MCP 和 Skill 才会生效。', emptyAgent: '也可以直接让 Agent 帮你登记：在 Claude Code 或 Codex 里说「帮我把家里的设备登记到 DeviceDeck」。', agentSetup: '查看 Agent 接入',
    lastAgent: 'MCP · 最近一次调用', never: '还没有调用', claudeCode: 'MCP · Claude Code（所有项目可用）', codex: 'MCP · Codex（~/.codex/config.toml）',
    tools: '开放的工具', readOnlyTool: '只读', probeTool: '只读探测，会记日志',
    toolList: { device_deck_list_devices: '列出设备和入口', device_deck_get_device: '读取一台设备', device_deck_connection_plan: '获取连接方案', device_deck_probe_device: '检查一个入口' },
    localData: '本地数据', dataDir: '数据目录', database: '数据库', permissions: '权限', permissionsValue: '目录 700，文件 600，仅当前用户可读',
    retention: '保留策略', retentionValue: '每个入口保留最近 {o} 次检查，活动保留最近 {e} 条', exportInventory: '导出清单 JSON',
    exportHelp: '导出的是可再导入的登记数据，不含检查记录；也没有任何密码，因为从来不存。', backup: '备份数据库',
    executableMissing: '找不到 device-deck 可执行文件，请把下面的路径换成你的安装位置。',
    language: 'English', loadFailed: '加载失败：{error}', justNow: '刚刚',
  },
  en: {
    navDevices: 'Devices', navAccess: 'Access profiles', navActivity: 'Agents & activity', loopback: 'Loopback only 127.0.0.1',
    cancel: 'Cancel', save: 'Save', close: 'Close', edit: 'Edit', remove: 'Delete', copy: 'Copy', copied: 'Copied',
    devicesTitle: 'Devices', devicesLead: 'Every endpoint, access method and last check result for each device. A status describes the moment it was observed, not now.',
    addDevice: '+ Add device', probeAll: 'Check all', probing: 'Checking…', search: 'Search name, ID, address, serial or tag',
    tileAll: 'All devices', tileVerified: 'Verified', tileAttention: 'Needs attention', tileUnchecked: 'Not checked',
    tileAllHint: v => v.n + (v.n === 1 ? ' endpoint' : ' endpoints'), tileVerifiedHint: 'Identity confirmed', tileAttentionHint: 'An endpoint needs a person', tileUncheckedHint: 'No observation yet',
    colEndpoint: 'Endpoint', colAddress: 'Address / serial', colAuth: 'Access', colStatus: 'Status', colChecked: 'Observed', colActions: 'Actions',
    probe: 'Check', plan: 'Connect', endpointsSummary: v => v.n + (v.n === 1 ? ' endpoint' : ' endpoints'), noMatch: 'No devices match.',
    emptyTitle: 'No devices yet', emptyText: 'Register an access profile first (method and location only, never a password), then add your first device.', emptyAction: 'Add access profile',
    detailEmpty: 'Select a device to see details.', facts: 'Overview', deviceId: 'Device ID', kind: 'Type', expectedHostname: 'Expected hostname', tags: 'Tags',
    os: 'System', source: 'Data source', unknown: 'Unknown', memory: 'Memory', disk: 'Disk', swap: 'Swap', available: 'available', free: 'free', readOnly: 'read-only',
    noMetrics: 'No successful resource sample yet.', todo: 'To do', allClear: 'Every endpoint passed its latest check.', editDevice: 'Edit device', probeDevice: 'Check every endpoint of this device',
    probeDone: '{name} · {status}', probeAllDone: 'Checked {n} endpoints',
    kinds: { computer: 'Computer', nas: 'NAS', router: 'Router', android: 'Android', ios: 'iOS', server: 'Server' },
    networks: { lan: 'LAN', tailscale: 'Tailscale', remote: 'Remote', usb: 'USB' },
    status: {
      verified: 'Verified', reachable_unverified: 'Reachable, unverified', timeout: 'Timed out', authentication_failed: 'Authentication failed',
      host_key_untrusted: 'Host key not trusted', configuration_mismatch: 'Configuration mismatch', identity_mismatch: 'Identity mismatch',
      interactive_required: 'Manual login required', dependency_missing: 'Client missing', pairing_required: 'Pairing required', not_connected: 'Not connected',
      wda_unavailable: 'WDA unavailable', invalid_response: 'Incomplete response', connection_failed: 'Connection failed', unchecked: 'Not checked',
    },
    next: {
      reachable_unverified: 'Reachable, but the device identity cannot be confirmed. Expected for WDA status reads.',
      timeout: 'Make sure the device is on and on the same network (or Tailscale is up), then check again.',
      authentication_failed: 'Check that the key file exists and is in the target authorized_keys, or that ssh-agent is unlocked.',
      host_key_untrusted: 'Connect once from a trusted terminal and verify the host key fingerprint independently. DeviceDeck never trusts new keys automatically.',
      configuration_mismatch: 'The SSH alias resolves to a different host, user or port than registered. Make them agree.',
      identity_mismatch: 'A different machine or account answered, for example after an IP change. Verify, then update the registration.',
      interactive_required: 'This is a password login. Enter the password yourself in a trusted terminal; DeviceDeck never fills it in.',
      dependency_missing: 'The local client (ssh, adb, ideviceinfo or curl) is missing. Install it and check again.',
      pairing_required: 'Unlock the phone and approve USB debugging for this computer, or finish wireless pairing first.',
      not_connected: 'The device is not connected over USB, or the phone is locked or has not tapped Trust.',
      wda_unavailable: 'WebDriverAgent is not running or the port is wrong. Restart it from your development machine.',
      invalid_response: 'The device returned incomplete or oversized data. See the detail below.',
      connection_failed: 'Connection failed. See the detail below, and connect once manually from a trusted terminal if needed.',
      unchecked: 'This endpoint has not been checked yet.',
    },
    editorNew: 'Add device', editorEdit: 'Edit device', identity: 'Identity', deviceName: 'Display name', idHelp: 'Starts with a lowercase letter; a-z 0-9 _ -. Cannot change after saving.',
    idTaken: 'This ID is already used by “{name}”. Choose another ID or edit that device.', idInvalid: 'IDs start with a lowercase letter and use only a-z, 0-9, _ and - (max 64).',
    hostnameHelp: 'SSH checks compare the remote hostname so an IP change cannot silently point at another machine.', tagsHelp: 'Comma separated, up to 20.',
    endpoints: 'Endpoints', addEndpoint: '+ Add endpoint', endpointId: 'Endpoint ID', protocol: 'Protocol', network: 'Network', host: 'IP / hostname', port: 'Port',
    username: 'SSH username', serial: 'Serial / UDID', serialHelpAdb: 'The serial from adb devices (IP:port for wireless debugging).', serialHelpIos: 'The UDID from idevice_id -l.',
    hostOptional: 'IP / hostname (optional)', sshAlias: 'Existing SSH alias (optional)', sshAliasHelp: 'Connect through a ~/.ssh/config alias; checks confirm it resolves to the registered address.',
    hostKeyAlias: 'Host key alias (optional)', credential: 'Access profile', noCredential: 'No access profile fits this protocol', manageCredentials: 'Add one',
    note: 'Note', removeEndpoint: 'Remove this endpoint', usbOnly: 'iOS USB always uses USB.',
    protocols: { ssh: ['SSH', 'Computer / NAS / router'], adb: ['ADB', 'Android'], ios_usb: ['iOS USB', 'iPhone / iPad'], wda: ['WDA', 'iOS automation status'] },
    checks: 'Before saving', checkId: 'Device ID', checkName: 'Display name', checkEndpoint: 'Endpoint {id}', checkHostname: 'Identity check',
    ok: 'Looks good', required: '{field} is required', duplicateEndpoint: 'Duplicate endpoint ID', endpointIdInvalid: 'Invalid endpoint ID',
    credentialMismatch: 'Access profile does not fit this protocol', hostnameMissing: 'No expected hostname; SSH can only confirm the username.', hostnameSet: 'SSH confirms both hostname and username.',
    preview: 'Command preview', previewHelp: 'What you would run to connect manually. Automatic checks add BatchMode and refuse password or keyboard prompts.', previewEmpty: 'Fill in the required fields to see the command.',
    saveDevice: 'Save device', deleteDevice: 'Delete device', deleteDeviceTitle: 'Delete “{name}”?', deleteDeviceText: 'Removes this device registration and its saved observations. Access profiles and key files are untouched. This cannot be undone.',
    saved: 'Saved', deleted: 'Deleted', fixErrors: 'Resolve the items marked red first.',
    accessTitle: 'Access profiles', accessLead: 'Only the authentication method and where the credential lives. Passwords, key contents and pairing codes stay in your keychain, ssh-agent or phone.',
    addProfile: '+ Add access profile', colName: 'Name', colMethod: 'Method', colLocation: 'Credential location', colUsedBy: 'Used by', unused: 'Unused',
    profileNew: 'Add access profile', profileEdit: 'Edit access profile', profileId: 'ID', profileName: 'Display name', method: 'Method',
    keyPath: 'Private key path', keyPathHelp: 'A path only, such as ~/.ssh/id_ed25519. Key contents are never read or uploaded.',
    vaultRef: 'External vault reference (optional)', vaultRefHelp: 'Such as keychain:home-nas or 1password:Servers/nas. A pointer, never a password.',
    deleteProfileTitle: 'Delete access profile “{name}”?', deleteProfileText: 'Removes only this registration. Your keychain and key files are untouched.', inUse: v => 'Used by ' + v.n + (v.n === 1 ? ' endpoint' : ' endpoints') + '; cannot delete',
    methods: { ssh_key: 'SSH key', ssh_agent: 'ssh-agent', password: 'Password (typed manually)', adb_pairing: 'ADB pairing', ios_trust: 'iOS trust', wda_access: 'WDA access' },
    planTitle: 'Connection plan', planPick: 'Choose an endpoint', planDevice: 'Device', planEndpoint: 'Endpoint', lastStatus: 'Last status', planSteps: 'Before you connect',
    planEmpty: 'Use “Connect” on the devices page, or choose an endpoint here.', authMethod: 'Method', credentialRef: 'Access profile ID',
    activityTitle: 'Agents & activity', activityLead: 'Day to day, just ask your agent; you do not need this console. This page confirms your agents are connected and logs every registration, check and deletion from the browser, the CLI and agents. Actions only; never a password.',
    actorAll: 'All', actors: { web: 'Browser', cli: 'CLI', mcp: 'Agent' }, latestN: 'Latest {n}', noEvents: 'No activity yet.',
    actions: { inventory_upsert: 'Saved registration', probe: 'Check', device_delete: 'Deleted device', credential_delete: 'Deleted access profile' },
    agents: 'Agent setup', agentsLead: 'MCP lets an agent read the inventory, get connection plans and run read-only checks; the skill tells it when to check and how to register devices with you. With both in place, just ask "how full is the NAS?".',
    agentName: { claude: 'Claude Code', codex: 'Codex' }, skillState: { linked: 'Installed', other: 'Installed (another copy)', missing: 'Not installed', broken: 'Broken link', conflict: 'Name conflict' },
    installSkill: 'Install or repair the skill', restartHint: 'Start a new agent session afterwards so it loads the MCP server and skill.', emptyAgent: 'Or let your agent do it: tell Claude Code or Codex "register my home devices in DeviceDeck".', agentSetup: 'Agent setup',
    lastAgent: 'MCP · latest call', never: 'No calls yet', claudeCode: 'MCP · Claude Code (all projects)', codex: 'MCP · Codex (~/.codex/config.toml)',
    tools: 'Exposed tools', readOnlyTool: 'read-only', probeTool: 'read-only probe, logged',
    toolList: { device_deck_list_devices: 'List devices and endpoints', device_deck_get_device: 'Read one device', device_deck_connection_plan: 'Get a connection plan', device_deck_probe_device: 'Check one endpoint' },
    localData: 'Local data', dataDir: 'Data directory', database: 'Database', permissions: 'Permissions', permissionsValue: 'Directory 700, file 600; current user only',
    retention: 'Retention', retentionValue: 'Latest {o} checks per endpoint; latest {e} activity events', exportInventory: 'Export inventory JSON',
    exportHelp: 'Exports re-importable registrations without observations. It contains no passwords because none are ever stored.', backup: 'Back up the database',
    executableMissing: 'device-deck was not found on PATH; replace the path below with your install location.',
    language: '中文', loadFailed: 'Could not load: {error}', justNow: 'just now',
  },
};

const PROTOCOLS = ['ssh', 'adb', 'ios_usb', 'wda'];
const NETWORKS = ['lan', 'tailscale', 'remote', 'usb'];
const KINDS = ['computer', 'nas', 'router', 'server', 'android', 'ios'];
const METHODS = ['ssh_key', 'ssh_agent', 'password', 'adb_pairing', 'ios_trust', 'wda_access'];
const COMPATIBLE = { ssh: ['ssh_key', 'ssh_agent', 'password'], adb: ['adb_pairing'], ios_usb: ['ios_trust'], wda: ['wda_access'] };
const DEFAULT_PORT = { ssh: 22, adb: 5555, ios_usb: 22, wda: 8100 };
const ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const TONE = {
  verified: 'good', unchecked: 'none',
  reachable_unverified: 'warn', interactive_required: 'warn', pairing_required: 'warn', host_key_untrusted: 'warn',
  dependency_missing: 'warn', not_connected: 'warn', wda_unavailable: 'warn',
};

const state = { devices: [], profiles: [], events: [], info: null, loaded: false, filter: 'all', query: '', selected: null, actor: 'all', busy: new Set(), draft: null };
let language = 'zh';
try { language = localStorage.getItem('device-deck-language') || (navigator.language.startsWith('zh') ? 'zh' : 'en'); } catch { /* storage unavailable */ }
const requested = new URLSearchParams(location.search).get('lang');
if (STRINGS[requested]) language = requested;
if (!STRINGS[language]) language = 'zh';

function t(key, vars) {
  let value = key.split('.').reduce((v, k) => (v == null ? v : v[k]), STRINGS[language]);
  if (value == null) value = key;
  if (typeof value === 'function') return value(vars || {});
  if (vars && typeof value === 'string') value = value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return value;
}

// h('div', {class: 'x', onclick}, child, 'text', [more]) – never parses HTML.
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (['value', 'checked', 'disabled', 'readOnly', 'selected', 'htmlFor'].includes(key)) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}
function svg(paths) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    el.append(p);
  }
  return el;
}
const ICON = {
  search: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8'],
  refresh: ['M20 11a8 8 0 0 0-14.5-4.5L4 8', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.5 4.5L20 16', 'M20 20v-4h-4'],
  download: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
};

async function api(path, method = 'GET', payload) {
  const options = { method, headers: {} };
  if (payload !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(path, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fields = result.fields ? ' (' + result.fields.map(f => f.filter(p => p !== 'body').join('.')).join(', ') + ')' : '';
    throw new Error((result.error || response.statusText) + fields);
  }
  return result;
}
const enc = encodeURIComponent;

function toast(message, tone) {
  const el = h('div', { class: 'toast' + (tone ? ' tone-' + tone : '') }, message);
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), tone === 'bad' ? 8000 : 3500);
}

// ---------- Formatting ----------

function bytes(n) {
  if (n == null) return t('unknown');
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return (i > 1 ? n.toFixed(1) : Math.round(n)) + ' ' + units[i];
}
function absolute(value) {
  return value ? new Date(value).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '';
}
function relative(value) {
  if (!value) return '—';
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  if (Math.abs(seconds) < 45) return t('justNow');
  const format = new Intl.RelativeTimeFormat(language === 'zh' ? 'zh-CN' : 'en', { numeric: 'auto' });
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(seconds) >= size || unit === 'minute') return format.format(Math.round(seconds / size), unit);
  }
  return '—';
}
function time(value) {
  return h('time', { datetime: value || null, title: absolute(value) || null }, relative(value));
}
function statusOf(endpoint) { return endpoint.observation?.status || 'unchecked'; }
function toneOf(status) { return TONE[status] || 'bad'; }
function pill(status) {
  return h('span', { class: 'pill tone-' + toneOf(status) }, h('span', { class: 'dot' }), t('status.' + status));
}
function deviceTone(device) {
  const tones = device.endpoints.map(e => toneOf(statusOf(e)));
  if (tones.some(x => x === 'bad' || x === 'warn')) return 'attention';
  if (tones.every(x => x === 'none')) return 'unchecked';
  return 'verified';
}
function address(e) {
  if (e.ssh_alias) return e.ssh_alias + ' → ' + (e.username ? e.username + '@' : '') + e.host + ':' + e.port;
  if (e.protocol === 'ssh') return e.username + '@' + e.host + ':' + e.port;
  if (e.protocol === 'wda') return e.host + ':' + e.port;
  return e.serial + (e.host ? ' · ' + e.host : '');
}
function credentialLocation(p) {
  if (p.key_path) return p.key_path;
  if (p.vault_ref) return p.vault_ref;
  return { ssh_agent: 'ssh-agent', password: '—', adb_pairing: 'adb keys', ios_trust: 'lockdown pairing', wda_access: 'WDA' }[p.method] || '—';
}
function shellQuote(arg) {
  if (arg === '') return "''";
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(arg)) return arg;
  return "'" + arg.replace(/'/g, "'\"'\"'") + "'";
}

// ---------- Data ----------

async function load() {
  try {
    const all = [];
    let offset = 0;
    for (;;) {
      const page = await api('/api/devices?limit=100&offset=' + offset);
      all.push(...page.items);
      if (!page.has_more) break;
      offset = page.next_offset;
    }
    const [profiles, events, info] = await Promise.all([api('/api/credentials'), api('/api/events?limit=100'), state.info ? state.info : api('/api/info')]);
    Object.assign(state, { devices: all, profiles, events, info, loaded: true });
  } catch (error) {
    toast(t('loadFailed', { error: error.message }), 'bad');
  }
  renderChrome();
  render();
}

async function probe(device, endpoint, quiet) {
  const key = device.id + ':' + endpoint.id;
  state.busy.add(key);
  render();
  try {
    const result = await api('/api/devices/' + enc(device.id) + '/endpoints/' + enc(endpoint.id) + '/probe', 'POST');
    endpoint.observation = result;
    if (!quiet) toast(t('probeDone', { name: device.name + ' · ' + endpoint.id, status: t('status.' + result.status) }), toneOf(result.status) === 'bad' ? 'bad' : null);
  } catch (error) {
    toast(error.message, 'bad');
  } finally {
    state.busy.delete(key);
  }
  render();
}
async function probeMany(pairs) {
  for (const [d, e] of pairs) await probe(d, e, true);
  toast(t('probeAllDone', { n: pairs.length }));
  await load();
}

// ---------- Routing ----------

function route() {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { parts, params: new URLSearchParams(query || '') };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

function render() {
  const { parts, params } = route();
  const page = parts[0] || 'devices';
  const view = document.getElementById('view');
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  const active = document.activeElement;
  const focused = active?.id;
  const caret = active && 'selectionStart' in active && active.type !== 'number' ? [active.selectionStart, active.selectionEnd] : null;
  let content;
  if (!state.loaded) content = [];
  else if (page === 'devices' && parts[1] === 'new') content = editorView(null);
  else if (page === 'devices' && parts[2] === 'edit') content = editorView(parts[1]);
  else if (page === 'access') content = accessView(params);
  else if (page === 'activity') content = activityView();
  else content = devicesView();
  view.replaceChildren(...[content].flat());
  const again = focused && document.getElementById(focused);
  if (again && again !== document.body) {
    again.focus({ preventScroll: true });
    if (caret && 'setSelectionRange' in again) again.setSelectionRange(...caret);
  }
}

function renderChrome() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  document.getElementById('language').textContent = t('language');
  document.getElementById('nav-devices').textContent = state.loaded ? state.devices.length : '';
  document.getElementById('nav-access').textContent = state.loaded ? state.profiles.length : '';
  document.getElementById('version').textContent = state.info ? 'v' + state.info.version : '';
  document.getElementById('data-dir').textContent = state.info?.data_dir_short || state.info?.data_dir || '';
  document.getElementById('data-dir').title = state.info?.data_dir || '';
}

function pageHead(title, lead, actions, crumbs) {
  return h('header', { class: 'page-head' },
    h('div', null, crumbs, h('h1', null, title), lead && h('p', null, lead)),
    actions && h('div', { class: 'actions' }, actions));
}

// ---------- Devices overview ----------

function matches(device) {
  const q = state.query.trim().toLowerCase();
  if (state.filter !== 'all' && deviceTone(device) !== state.filter) return false;
  if (!q) return true;
  const hay = [device.id, device.name, device.kind, t('kinds.' + device.kind), device.expected_hostname, ...device.tags,
    ...device.endpoints.flatMap(e => [e.id, e.host, e.serial, e.ssh_alias, e.username, e.protocol, e.network])];
  return hay.some(v => v && String(v).toLowerCase().includes(q));
}

function devicesView() {
  const { devices } = state;
  const endpointCount = devices.reduce((n, d) => n + d.endpoints.length, 0);
  const counts = { all: devices.length, verified: 0, attention: 0, unchecked: 0 };
  for (const d of devices) counts[deviceTone(d)]++;
  const shown = devices.filter(matches);
  if (!shown.some(d => d.id === state.selected)) state.selected = shown[0]?.id || null;
  const selected = devices.find(d => d.id === state.selected);
  const allPairs = shown.flatMap(d => d.endpoints.map(e => [d, e]));
  const busy = state.busy.size > 0;

  const head = pageHead(t('devicesTitle'), t('devicesLead'), [
    h('label', { class: 'search' }, svg(ICON.search), h('span', { class: 'sr-only' }, t('search')),
      h('input', { id: 'device-search', type: 'search', placeholder: t('search'), value: state.query, oninput: e => { state.query = e.target.value; render(); } }),
      h('span', { class: 'kbd', 'aria-hidden': 'true' }, '/')),
    h('button', { class: 'button', type: 'button', disabled: busy || !allPairs.length, onclick: () => probeMany(allPairs) }, svg(ICON.refresh), busy ? t('probing') : t('probeAll')),
    h('a', { class: 'button primary', href: '#/devices/new' }, t('addDevice')),
  ]);

  if (!devices.length) {
    return [head, h('section', { class: 'panel empty' }, h('h2', null, t('emptyTitle')), h('p', null, t('emptyText')),
      state.profiles.length
        ? h('a', { class: 'button primary', href: '#/devices/new' }, t('addDevice'))
        : h('button', { class: 'button primary', type: 'button', onclick: () => openProfile(null) }, t('emptyAction')),
      h('p', { class: 'small muted' }, t('emptyAgent'), ' ', h('a', { href: '#/activity' }, t('agentSetup'))))];
  }

  const tiles = h('div', { class: 'tiles', role: 'group', 'aria-label': t('devicesTitle') },
    [['all', 'none', t('tileAllHint', { n: endpointCount })], ['verified', 'good', t('tileVerifiedHint')],
      ['attention', 'warn', t('tileAttentionHint')], ['unchecked', 'none', t('tileUncheckedHint')]].map(([key, tone, hint]) =>
      h('button', { class: 'tile', type: 'button', 'aria-pressed': String(state.filter === key), onclick: () => { state.filter = state.filter === key && key !== 'all' ? 'all' : key; render(); } },
        h('span', { class: 'label' }, key !== 'all' && h('span', { class: 'dot tone-' + tone }), t('tile' + key[0].toUpperCase() + key.slice(1))),
        h('span', { class: 'num' }, counts[key]), h('span', { class: 'hint' }, hint))));

  const table = h('section', { class: 'panel' }, h('div', { class: 'scroll-x' }, h('div', { class: 'inventory', role: 'table', 'aria-label': t('devicesTitle') },
    h('div', { class: 'cols head', role: 'row' }, ['colEndpoint', 'colAddress', 'colAuth', 'colStatus', 'colChecked', 'colActions'].map(k => h('span', { role: 'columnheader' }, t(k)))),
    shown.length ? shown.map(deviceGroup) : h('p', { class: 'empty' }, t('noMatch')))));

  return [head, tiles, h('div', { class: 'split' }, h('div', { class: 'main-col' }, table), h('aside', { class: 'side-col sticky' }, detailPanel(selected)))];
}

function deviceGroup(device) {
  const tone = deviceTone(device);
  return h('div', { class: 'group', role: 'rowgroup' },
    h('button', { class: 'device-head', type: 'button', 'aria-pressed': String(device.id === state.selected), onclick: () => { state.selected = device.id; render(); } },
      h('span', { class: 'dot tone-' + ({ verified: 'good', attention: device.endpoints.some(e => toneOf(statusOf(e)) === 'bad') ? 'bad' : 'warn', unchecked: 'none' }[tone]) }),
      h('span', { class: 'name' }, device.name), h('span', { class: 'tag' }, t('kinds.' + device.kind)),
      h('span', { class: 'muted small mono' }, device.id),
      device.tags.map(tag => h('span', { class: 'tag' }, tag)),
      h('span', { class: 'summary' }, t('endpointsSummary', { n: device.endpoints.length }))),
    device.endpoints.map(e => endpointRow(device, e)));
}

function endpointRow(device, e) {
  const status = statusOf(e);
  const busy = state.busy.has(device.id + ':' + e.id);
  return h('div', { class: 'cols', role: 'row' },
    h('span', { class: 'route', role: 'cell' }, h('b', { class: 'mono' }, e.id), h('span', null, t('networks.' + e.network) + ' · ' + t('protocols.' + e.protocol)[0])),
    h('span', { class: 'mono small ellipsis', role: 'cell', title: address(e) }, address(e)),
    h('span', { class: 'small ellipsis', role: 'cell', title: e.credential.name }, t('methods.' + e.credential.method)),
    h('span', { role: 'cell', title: e.observation?.detail || null }, busy ? h('span', { class: 'pill' }, t('probing')) : pill(status)),
    h('span', { class: 'small muted', role: 'cell' }, time(e.observation?.checked_at)),
    h('span', { class: 'row-actions', role: 'cell' },
      h('button', { class: 'button small', type: 'button', disabled: busy, onclick: () => probe(device, e) }, t('probe')),
      h('a', { class: 'button small', href: '#/access?device=' + enc(device.id) + '&endpoint=' + enc(e.id) }, t('plan'))));
}

function latestMetrics(device) {
  return device.endpoints.map(e => e.observation).filter(o => o?.metrics).sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0];
}

function bar(label, used, total, extra) {
  const percent = total ? Math.min(100, Math.max(0, (used / total) * 100)) : null;
  const fill = h('i', { class: percent >= 95 ? 'full' : percent >= 80 ? 'high' : null });
  fill.style.width = (percent ?? 0) + '%';
  return h('div', { class: 'bar-row' },
    h('div', { class: 'top' }, h('b', null, label), h('span', null, used == null || total == null ? t('unknown') : bytes(used) + ' / ' + bytes(total) + (extra ? ' · ' + extra : ''))),
    h('div', { class: 'bar', role: 'meter', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': percent == null ? null : String(Math.round(percent)) }, fill));
}

function detailPanel(device) {
  if (!device) return h('section', { class: 'panel pad' }, h('p', { class: 'muted' }, t('detailEmpty')));
  const observation = latestMetrics(device);
  const m = observation?.metrics;
  const system = m?.system;
  const osText = system ? [system.name || system.platform, system.version, system.build].filter(Boolean).join(' ') : t('unknown');
  const pending = device.endpoints.filter(e => toneOf(statusOf(e)) !== 'good');
  const busy = device.endpoints.some(e => state.busy.has(device.id + ':' + e.id));

  const resources = [];
  if (m) {
    if (m.memory) {
      const mem = m.memory;
      const spare = mem.available_bytes != null ? bytes(mem.available_bytes) + ' ' + t('available') : mem.free_bytes != null ? bytes(mem.free_bytes) + ' ' + t('free') : null;
      resources.push(bar(t('memory'), mem.used_bytes, mem.total_bytes, spare));
      if (mem.swap_used_bytes) resources.push(h('p', { class: 'small muted' }, t('swap') + ' ' + bytes(mem.swap_used_bytes)));
    }
    for (const disk of m.disks || []) {
      resources.push(bar(disk.mount, disk.used_bytes, disk.total_bytes, disk.read_only ? t('readOnly') : disk.filesystem_type));
    }
  }

  return h('section', { class: 'panel pad', 'aria-label': device.name },
    h('div', { class: 'detail-head' },
      h('div', null, h('span', { class: 'tag' }, t('kinds.' + device.kind)), h('h2', null, device.name), h('span', { class: 'mono small muted' }, device.id)),
      h('a', { class: 'button small', href: '#/devices/' + enc(device.id) + '/edit' }, t('editDevice'))),
    h('dl', { class: 'facts' },
      h('dt', null, t('expectedHostname')), h('dd', { class: 'mono' }, device.expected_hostname || '—'),
      h('dt', null, t('os')), h('dd', null, osText, system?.kernel && h('span', { class: 'muted small' }, ' · ' + system.kernel)),
      h('dt', null, t('source')), h('dd', null, observation ? [h('span', { class: 'mono' }, observation.endpoint_id), ' · ', time(observation.checked_at)] : '—'),
      device.tags.length > 0 && [h('dt', null, t('tags')), h('dd', null, device.tags.join(', '))]),
    resources.length ? h('div', { class: 'stack' }, resources) : h('p', { class: 'small muted' }, t('noMetrics')),
    h('div', { class: 'stack' }, h('h3', null, t('todo')),
      pending.length
        ? pending.map(e => {
          const status = statusOf(e);
          return h('div', { class: 'todo tone-' + toneOf(status) }, h('span', { class: 'dot' }),
            h('div', null, h('b', null, e.id + ' · ' + t('status.' + status)), h('p', null, t('next.' + status)),
              e.observation?.detail && h('p', { class: 'mono small muted' }, e.observation.detail)));
        })
        : h('p', { class: 'ok-text' }, t('allClear'))),
    h('button', { class: 'button outline', type: 'button', disabled: busy, onclick: () => probeMany(device.endpoints.map(e => [device, e])) }, busy ? t('probing') : t('probeDevice')));
}

// ---------- Device editor ----------

function blankEndpoint(id, protocol = 'ssh') {
  return { id, network: protocol === 'ios_usb' ? 'usb' : 'lan', protocol, host: '', port: DEFAULT_PORT[protocol], username: '',
    credential_id: state.profiles.find(p => COMPATIBLE[protocol].includes(p.method))?.id || '', ssh_alias: '', host_key_alias: '', serial: '', note: '' };
}

function editorView(editId) {
  const draftKey = editId || '__new__';
  if (!state.draft || state.draft.key !== draftKey) {
    const source = editId ? state.devices.find(d => d.id === editId) : null;
    if (editId && !source) return h('section', { class: 'panel empty' }, h('p', null, t('detailEmpty')), h('a', { class: 'button', href: '#/devices' }, t('navDevices')));
    const value = source ? JSON.parse(JSON.stringify(source)) : { id: '', name: '', kind: 'computer', expected_hostname: '', tags: [], endpoints: [blankEndpoint('lan')] };
    for (const e of value.endpoints) {
      delete e.credential; delete e.observation;
      for (const k of ['host', 'username', 'ssh_alias', 'host_key_alias', 'serial', 'note']) e[k] = e[k] ?? '';
    }
    value.expected_hostname = value.expected_hostname ?? '';
    state.draft = { key: draftKey, editing: !!source, value, active: 0, tagsText: value.tags.join(', ') };
  }
  const draft = state.draft;
  const d = draft.value;
  draft.active = Math.min(draft.active, d.endpoints.length - 1);
  const title = draft.editing ? t('editorEdit') : t('editorNew');

  const idField = h('input', { id: 'f-id', class: 'input mono', value: d.id, readOnly: draft.editing, autocomplete: 'off', spellcheck: 'false',
    oninput: e => { d.id = e.target.value.trim(); refresh(); } });
  const identity = h('section', { class: 'panel pad' }, h('h2', null, t('identity')),
    h('div', { class: 'form-grid' },
      h('label', { class: 'field' }, h('span', null, t('deviceName')),
        h('input', { id: 'f-name', class: 'input', value: d.name, maxlength: '100', oninput: e => { d.name = e.target.value; refresh(); } })),
      h('label', { class: 'field' }, h('span', null, t('deviceId')), idField, h('span', { class: 'hint', id: 'id-hint' }, t('idHelp'))),
      h('label', { class: 'field' }, h('span', null, t('expectedHostname')),
        h('input', { id: 'f-hostname', class: 'input mono', value: d.expected_hostname, maxlength: '200', spellcheck: 'false', oninput: e => { d.expected_hostname = e.target.value.trim(); refresh(); } }),
        h('span', { class: 'hint' }, t('hostnameHelp'))),
      h('label', { class: 'field' }, h('span', null, t('tags')),
        h('input', { id: 'f-tags', class: 'input', value: draft.tagsText, oninput: e => { draft.tagsText = e.target.value; d.tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean); refresh(); } }),
        h('span', { class: 'hint' }, t('tagsHelp'))),
      h('fieldset', { class: 'segments span-2' }, h('legend', null, t('kind')),
        KINDS.map(kind => h('label', { class: 'segment' },
          h('input', { type: 'radio', name: 'kind', value: kind, checked: d.kind === kind, onchange: () => { d.kind = kind; refresh(); } }),
          h('span', null, t('kinds.' + kind)))))));

  const endpoints = h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', null, t('endpoints'))),
    h('div', { class: 'tabs-layout' },
      h('div', { class: 'tab-list', role: 'tablist', 'aria-label': t('endpoints') },
        d.endpoints.map((e, i) => h('button', { class: 'tab', type: 'button', role: 'tab', id: 'tab-' + i, 'aria-selected': String(i === draft.active),
          onclick: () => { draft.active = i; render(); } }, h('b', { class: 'tab-id' }, e.id || '—'), h('small', { class: 'tab-sub' }, tabSubtitle(e)))),
        d.endpoints.length < 20 && h('button', { class: 'add-tab', type: 'button', onclick: () => {
          const used = new Set(d.endpoints.map(e => e.id));
          const id = ['remote', 'tailscale', 'usb', 'lan'].find(x => !used.has(x)) || 'endpoint-' + (d.endpoints.length + 1);
          d.endpoints.push(blankEndpoint(id));
          if (id === 'remote' || id === 'tailscale') d.endpoints.at(-1).network = id;
          draft.active = d.endpoints.length - 1;
          render();
        } }, t('addEndpoint'))),
      h('div', { class: 'tab-panel', role: 'tabpanel', 'aria-labelledby': 'tab-' + draft.active }, endpointForm(d, draft.active))));

  const head = pageHead(title, null, [
    draft.editing && h('button', { class: 'button danger', type: 'button', onclick: () => deleteDevice(d) }, t('deleteDevice')),
    h('a', { class: 'button', href: '#/devices' }, t('cancel')),
    h('button', { class: 'button primary', type: 'button', id: 'save-device', onclick: saveDevice }, t('saveDevice')),
  ], h('nav', { class: 'crumbs' }, h('a', { href: '#/devices' }, t('navDevices')), ' / ', draft.editing ? d.id : t('editorNew')));

  const side = h('aside', { class: 'side-col' },
    h('section', { class: 'panel pad' }, h('h2', null, t('checks')), h('div', { class: 'stack', id: 'checks' })),
    h('section', { class: 'code-panel' }, h('h2', null, t('preview')), h('p', { class: 'small muted' }, t('previewHelp')), h('pre', { id: 'preview' })));

  const nodes = [head, h('div', { class: 'split' }, h('div', { class: 'main-col' }, identity, endpoints), side)];
  queueMicrotask(refresh);
  return nodes;
}

function tabSubtitle(e) {
  return t('networks.' + e.network) + ' · ' + t('protocols.' + e.protocol)[0];
}

function endpointForm(d, index) {
  const e = d.endpoints[index];
  const field = (key, label, attrs = {}, hint) => h('label', { class: 'field' + (attrs.wide ? ' span-2' : '') }, h('span', null, label),
    h('input', { class: 'input' + (attrs.mono === false ? '' : ' mono'), id: 'e-' + key, value: e[key] ?? '', spellcheck: 'false', autocomplete: 'off', type: attrs.type, min: attrs.min, max: attrs.max,
      oninput: ev => { e[key] = key === 'port' ? Number(ev.target.value) : ev.target.value.trim(); refresh(); } }),
    hint && h('span', { class: 'hint' }, hint));

  const compatible = state.profiles.filter(p => COMPATIBLE[e.protocol].includes(p.method));
  if (!compatible.some(p => p.id === e.credential_id)) e.credential_id = compatible[0]?.id || '';
  const credential = h('label', { class: 'field span-2' }, h('span', null, t('credential')),
    compatible.length
      ? h('select', { class: 'input', id: 'e-credential', onchange: ev => { e.credential_id = ev.target.value; refresh(); } },
        compatible.map(p => h('option', { value: p.id, selected: p.id === e.credential_id }, p.name + ' · ' + t('methods.' + p.method))))
      : h('span', { class: 'hint error' }, t('noCredential') + ' · ', h('button', { class: 'link-inline button small', type: 'button', onclick: () => openProfile(null, COMPATIBLE[e.protocol][0]) }, t('manageCredentials'))));

  const fields = [];
  if (e.protocol === 'ssh') {
    fields.push(field('host', t('host')), field('port', t('port'), { type: 'number', min: 1, max: 65535 }), field('username', t('username')),
      field('ssh_alias', t('sshAlias'), {}, t('sshAliasHelp')), field('host_key_alias', t('hostKeyAlias'), { wide: true }));
  } else if (e.protocol === 'adb') {
    fields.push(field('serial', t('serial'), { wide: true }, t('serialHelpAdb')), field('host', t('hostOptional')), field('port', t('port'), { type: 'number', min: 1, max: 65535 }));
  } else if (e.protocol === 'ios_usb') {
    fields.push(field('serial', t('serial'), { wide: true }, t('serialHelpIos')));
  } else {
    fields.push(field('host', t('host')), field('port', t('port'), { type: 'number', min: 1, max: 65535 }));
  }

  return [
    h('div', { class: 'form-grid' },
      field('id', t('endpointId'), { wide: true }),
      h('fieldset', { class: 'segments wide span-2' }, h('legend', null, t('protocol')),
        PROTOCOLS.map(p => h('label', { class: 'segment' },
          h('input', { type: 'radio', name: 'protocol', value: p, checked: e.protocol === p, onchange: () => {
            if (e.port === DEFAULT_PORT[e.protocol]) e.port = DEFAULT_PORT[p];
            if (e.protocol === 'ios_usb' && p !== 'ios_usb') e.network = 'lan';
            e.protocol = p;
            if (p === 'ios_usb') e.network = 'usb';
            render();
          } }),
          h('span', null, t('protocols.' + p)[0], h('small', null, t('protocols.' + p)[1]))))),
      h('fieldset', { class: 'segments span-2' }, h('legend', null, t('network')),
        NETWORKS.map(n => h('label', { class: 'segment' },
          h('input', { type: 'radio', name: 'network', value: n, checked: e.network === n, disabled: e.protocol === 'ios_usb' && n !== 'usb',
            onchange: () => { e.network = n; refresh(); } }),
          h('span', null, t('networks.' + n)))),
        e.protocol === 'ios_usb' && h('span', { class: 'hint' }, t('usbOnly'))),
      fields, credential,
      h('label', { class: 'field span-2' }, h('span', null, t('note')),
        h('input', { class: 'input', id: 'e-note', value: e.note, maxlength: '500', oninput: ev => { e.note = ev.target.value; refresh(); } }))),
    d.endpoints.length > 1 && h('div', null, h('button', { class: 'button danger small', type: 'button', onclick: () => {
      d.endpoints.splice(index, 1);
      state.draft.active = Math.max(0, index - 1);
      render();
    } }, t('removeEndpoint'))),
  ];
}

function endpointPayload(e) {
  const out = { id: e.id, network: e.protocol === 'ios_usb' ? 'usb' : e.network, protocol: e.protocol, port: Number(e.port) || DEFAULT_PORT[e.protocol],
    credential_id: e.credential_id, note: e.note || '' };
  const keep = { ssh: ['host', 'username', 'ssh_alias', 'host_key_alias'], adb: ['serial', 'host'], ios_usb: ['serial'], wda: ['host'] }[e.protocol];
  for (const key of keep) out[key] = e[key] || null;
  return out;
}

function devicePayload(d) {
  return { id: d.id, name: d.name.trim(), kind: d.kind, expected_hostname: d.expected_hostname || null, tags: d.tags, endpoints: d.endpoints.map(endpointPayload) };
}

function checkDraft(draft) {
  const d = draft.value;
  const checks = [];
  const add = (tone, label, text) => checks.push({ tone, label, text });
  const existing = state.devices.find(x => x.id === d.id);
  if (!d.id) add('bad', t('checkId'), t('required', { field: t('deviceId') }));
  else if (!ID_PATTERN.test(d.id)) add('bad', t('checkId'), t('idInvalid'));
  else if (!draft.editing && existing) add('bad', t('checkId'), t('idTaken', { name: existing.name }));
  else add('good', t('checkId'), d.id);
  add(d.name.trim() ? 'good' : 'bad', t('checkName'), d.name.trim() ? t('ok') : t('required', { field: t('deviceName') }));
  const seen = new Set();
  for (const e of d.endpoints) {
    const problems = [];
    if (!ID_PATTERN.test(e.id || '')) problems.push(t('endpointIdInvalid'));
    else if (seen.has(e.id)) problems.push(t('duplicateEndpoint'));
    seen.add(e.id);
    if (['ssh', 'wda'].includes(e.protocol) && !e.host) problems.push(t('required', { field: t('host') }));
    if (e.protocol === 'ssh' && !e.username) problems.push(t('required', { field: t('username') }));
    if (['adb', 'ios_usb'].includes(e.protocol) && !e.serial) problems.push(t('required', { field: t('serial') }));
    if (!(Number(e.port) >= 1 && Number(e.port) <= 65535)) problems.push(t('required', { field: t('port') }));
    const profile = state.profiles.find(p => p.id === e.credential_id);
    if (!profile) problems.push(t('noCredential'));
    else if (!COMPATIBLE[e.protocol].includes(profile.method)) problems.push(t('credentialMismatch'));
    add(problems.length ? 'bad' : 'good', t('checkEndpoint', { id: e.id || '—' }), problems.length ? problems.join('；') : address(endpointPayload(e)));
  }
  if (d.endpoints.some(e => e.protocol === 'ssh')) {
    add(d.expected_hostname ? 'good' : 'warn', t('checkHostname'), d.expected_hostname ? t('hostnameSet') : t('hostnameMissing'));
  }
  return checks;
}

function previewCommand(e) {
  const profile = state.profiles.find(p => p.id === e.credential_id);
  if (e.protocol === 'ssh') {
    if (!profile || !e.host || !e.username) return null;
    const args = ['ssh', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=5', '-p', String(e.port)];
    if (profile.method === 'ssh_key') args.push('-o', 'IdentitiesOnly=yes', '-i', profile.key_path);
    else if (profile.method === 'ssh_agent') args.push('-o', 'IdentitiesOnly=no');
    if (e.host_key_alias) args.push('-o', 'HostKeyAlias=' + e.host_key_alias);
    args.push(e.ssh_alias || e.username + '@' + e.host);
    return args.map(a => (a.startsWith('~/') ? '~/' + shellQuote(a.slice(2)) : shellQuote(a))).join(' ');
  }
  if (e.protocol === 'adb') return e.serial ? ['adb', '-s', e.serial, 'get-state'].map(shellQuote).join(' ') : null;
  if (e.protocol === 'ios_usb') return e.serial ? ['ideviceinfo', '-u', e.serial, '-k', 'ProductVersion'].map(shellQuote).join(' ') : null;
  if (!e.host) return null;
  return 'curl ' + shellQuote('http://' + (e.host.includes(':') ? '[' + e.host + ']' : e.host) + ':' + e.port + '/status');
}

// Updates checks, preview and tab labels without re-rendering inputs (keeps focus and caret).
function refresh() {
  const draft = state.draft;
  if (!draft || !document.getElementById('checks')) return;
  const checks = checkDraft(draft);
  document.getElementById('checks').replaceChildren(...checks.map(c =>
    h('div', { class: 'check tone-' + c.tone }, h('span', { class: 'mark', 'aria-hidden': 'true' }, c.tone === 'good' ? '✓' : c.tone === 'warn' ? '!' : '×'),
      h('div', null, h('b', null, c.label), h('p', null, c.text)))));
  const d = draft.value;
  const idCheck = checks[0];
  const idInput = document.getElementById('f-id');
  const idHint = document.getElementById('id-hint');
  const idBad = idCheck.tone === 'bad' && !!d.id;
  idInput.classList.toggle('invalid', idBad);
  idInput.setAttribute('aria-invalid', String(idBad));
  idHint.textContent = idBad ? idCheck.text : t('idHelp');
  idHint.classList.toggle('error', idBad);
  const lines = d.endpoints.map(e => '# ' + (e.id || '—') + ' · ' + tabSubtitle(e) + '\n' + (previewCommand(e) || t('previewEmpty')));
  document.getElementById('preview').textContent = lines.join('\n\n');
  document.querySelectorAll('.tab').forEach((tab, i) => {
    const e = d.endpoints[i];
    if (!e) return;
    tab.querySelector('.tab-id').textContent = e.id || '—';
    tab.querySelector('.tab-sub').textContent = tabSubtitle(e);
  });
}

async function saveDevice() {
  const draft = state.draft;
  if (checkDraft(draft).some(c => c.tone === 'bad')) { toast(t('fixErrors'), 'bad'); return; }
  const payload = devicePayload(draft.value);
  const button = document.getElementById('save-device');
  button.disabled = true;
  try {
    if (draft.editing) await api('/api/devices/' + enc(payload.id), 'PUT', payload);
    else await api('/api/devices', 'POST', payload);
    state.draft = null;
    state.selected = payload.id;
    toast(t('saved'));
    await load();
    go('#/devices');
  } catch (error) {
    toast(error.message, 'bad');
    button.disabled = false;
  }
}

async function deleteDevice(d) {
  const name = state.devices.find(x => x.id === d.id)?.name || d.id;
  if (!await confirmAction(t('deleteDeviceTitle', { name }), t('deleteDeviceText'), t('deleteDevice'))) return;
  try {
    await api('/api/devices/' + enc(d.id), 'DELETE');
    state.draft = null;
    toast(t('deleted'));
    await load();
    go('#/devices');
  } catch (error) {
    toast(error.message, 'bad');
  }
}

function confirmAction(title, text, okLabel) {
  const dialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-ok').textContent = okLabel;
  return new Promise(resolve => {
    const finish = ok => event => {
      event?.preventDefault();
      if (dialog.open) dialog.close();
      resolve(ok);
    };
    document.getElementById('confirm-ok').onclick = finish(true);
    document.getElementById('confirm-cancel').onclick = finish(false);
    dialog.oncancel = finish(false);
    dialog.showModal();
  });
}

// ---------- Access profiles ----------

function usage(profileId) {
  return state.devices.flatMap(d => d.endpoints.filter(e => e.credential_id === profileId).map(e => d.id + ':' + e.id));
}

function accessView(params) {
  const head = pageHead(t('accessTitle'), t('accessLead'), [h('button', { class: 'button primary', type: 'button', onclick: () => openProfile(null) }, t('addProfile'))]);
  const rows = state.profiles.map(p => {
    const users = usage(p.id);
    return h('div', { class: 'table-row', role: 'row' },
      h('span', { class: 'stacked', role: 'cell' }, h('b', null, p.name), h('span', { class: 'mono small muted' }, p.id)),
      h('span', { role: 'cell' }, h('span', { class: 'tag' }, t('methods.' + p.method))),
      h('span', { class: 'mono small ellipsis', role: 'cell', title: credentialLocation(p) }, credentialLocation(p)),
      h('span', { class: 'small', role: 'cell' }, users.length ? users.map((u, i) => [i ? ', ' : '', h('span', { class: 'mono' }, u)]) : h('span', { class: 'muted' }, t('unused'))),
      h('span', { class: 'row-actions', role: 'cell' },
        h('button', { class: 'button small', type: 'button', onclick: () => openProfile(p) }, t('edit')),
        h('button', { class: 'button small danger', type: 'button', disabled: users.length > 0, title: users.length ? t('inUse', { n: users.length }) : null, onclick: () => deleteProfile(p) }, t('remove'))));
  });
  const table = h('section', { class: 'panel' }, h('div', { class: 'scroll-x' }, h('div', { class: 'profiles', role: 'table', 'aria-label': t('accessTitle') },
    h('div', { class: 'table-row head', role: 'row' }, ['colName', 'colMethod', 'colLocation', 'colUsedBy', 'colActions'].map(k => h('span', { role: 'columnheader' }, t(k)))),
    rows.length ? rows : h('p', { class: 'empty' }, t('emptyText')))));
  return [head, h('div', { class: 'split' }, h('div', { class: 'main-col' }, table), h('aside', { class: 'side-col' }, planPanel(params)))];
}

function planPanel(params) {
  const deviceId = params.get('device');
  const endpointId = params.get('endpoint');
  const device = state.devices.find(d => d.id === deviceId);
  const endpoint = device?.endpoints.find(e => e.id === endpointId);
  const options = state.devices.flatMap(d => d.endpoints.map(e => h('option', { value: d.id + '\n' + e.id, selected: d === device && e === endpoint }, d.name + ' · ' + e.id)));
  const picker = h('label', { class: 'field' }, h('span', null, t('planPick')),
    h('select', { class: 'input', id: 'plan-pick', onchange: ev => { const [d, e] = ev.target.value.split('\n'); go('#/access?device=' + enc(d) + '&endpoint=' + enc(e)); } },
      !endpoint && h('option', { value: '', selected: true }, '—'), options));
  const panel = h('section', { class: 'panel pad', 'aria-live': 'polite' }, h('h2', null, t('planTitle')), picker);
  if (!endpoint) {
    panel.append(h('p', { class: 'small muted' }, t('planEmpty')));
    return panel;
  }
  const status = statusOf(endpoint);
  const body = h('div', { class: 'stack' }, h('p', { class: 'small muted' }, '…'));
  panel.append(
    h('div', { class: 'banner tone-' + toneOf(status) }, h('div', null, h('strong', null, t('lastStatus') + ' · ' + t('status.' + status)),
      endpoint.observation && [' · ', time(endpoint.observation.checked_at)],
      status !== 'verified' && h('p', null, t('next.' + status)),
      endpoint.observation?.detail && h('p', { class: 'mono small' }, endpoint.observation.detail))),
    body);
  api('/api/devices/' + enc(device.id) + '/endpoints/' + enc(endpoint.id) + '/plan').then(plan => {
    body.replaceChildren(
      codeBlock(plan.command),
      plan.steps.length > 0 && h('div', { class: 'stack' }, h('h3', null, t('planSteps')), h('ol', { class: 'steps' }, plan.steps.map(s => h('li', null, s)))),
      h('dl', { class: 'facts' },
        h('dt', null, t('protocol')), h('dd', null, t('protocols.' + plan.protocol)[0]),
        h('dt', null, t('authMethod')), h('dd', null, t('methods.' + plan.auth_method)),
        h('dt', null, t('credentialRef')), h('dd', { class: 'mono' }, plan.credential_ref)));
  }).catch(error => body.replaceChildren(h('p', { class: 'hint error' }, error.message)));
  return panel;
}

function codeBlock(text) {
  const button = h('button', { class: 'copy', type: 'button', onclick: async () => {
    try { await navigator.clipboard.writeText(text); button.textContent = t('copied'); setTimeout(() => { button.textContent = t('copy'); }, 1500); } catch (error) { toast(error.message, 'bad'); }
  } }, t('copy'));
  return h('div', { class: 'code' }, h('pre', null, text), button);
}

let profileEditing = null;
function openProfile(profile, method) {
  profileEditing = profile;
  const dialog = document.getElementById('credential-dialog');
  const form = document.getElementById('credential-form');
  document.getElementById('credential-title').textContent = profile ? t('profileEdit') : t('profileNew');
  form.querySelector('.form-error').textContent = '';
  const current = { id: '', name: '', method: method || 'ssh_key', key_path: '', vault_ref: '', ...(profile || {}) };
  const keyField = h('label', { class: 'field' }, h('span', null, t('keyPath')),
    h('input', { class: 'input mono', name: 'key_path', value: current.key_path || '', placeholder: '~/.ssh/id_ed25519', spellcheck: 'false', maxlength: '500' }),
    h('span', { class: 'hint' }, t('keyPathHelp')));
  const methodSelect = h('select', { class: 'input', name: 'method', onchange: () => { keyField.hidden = methodSelect.value !== 'ssh_key'; } },
    METHODS.map(m => h('option', { value: m, selected: m === current.method }, t('methods.' + m))));
  keyField.hidden = current.method !== 'ssh_key';
  form.querySelector('.dialog-body').replaceChildren(
    h('div', { class: 'form-grid' },
      h('label', { class: 'field' }, h('span', null, t('profileName')), h('input', { class: 'input', name: 'name', value: current.name, required: true, maxlength: '100' })),
      h('label', { class: 'field' }, h('span', null, t('profileId')), h('input', { class: 'input mono', name: 'id', value: current.id, readOnly: !!profile, required: true, spellcheck: 'false', autocomplete: 'off' }),
        h('span', { class: 'hint' }, t('idHelp'))),
      h('label', { class: 'field span-2' }, h('span', null, t('method')), methodSelect)),
    keyField,
    h('label', { class: 'field' }, h('span', null, t('vaultRef')),
      h('input', { class: 'input mono', name: 'vault_ref', value: current.vault_ref || '', placeholder: 'keychain:home-nas', spellcheck: 'false', maxlength: '200', autocomplete: 'off' }),
      h('span', { class: 'hint' }, t('vaultRefHelp'))));
  dialog.showModal();
  form.elements.name.focus();
}

async function submitProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = form.querySelector('.form-error');
  const value = name => form.elements[name].value.trim();
  const data = { id: value('id'), name: value('name'), method: value('method'), key_path: value('method') === 'ssh_key' ? value('key_path') || null : null, vault_ref: value('vault_ref') || null };
  if (!ID_PATTERN.test(data.id)) { error.textContent = t('idInvalid'); return; }
  if (!profileEditing && state.profiles.some(p => p.id === data.id)) { error.textContent = t('idTaken', { name: state.profiles.find(p => p.id === data.id).name }); return; }
  try {
    if (profileEditing) await api('/api/credentials/' + enc(data.id), 'PUT', data);
    else await api('/api/credentials', 'POST', data);
    document.getElementById('credential-dialog').close();
    toast(t('saved'));
    await load();
  } catch (e) {
    error.textContent = e.message;
  }
}

async function deleteProfile(p) {
  if (!await confirmAction(t('deleteProfileTitle', { name: p.name }), t('deleteProfileText'), t('remove'))) return;
  try {
    await api('/api/credentials/' + enc(p.id), 'DELETE');
    toast(t('deleted'));
    await load();
  } catch (error) {
    toast(error.message, 'bad');
  }
}

// ---------- Agents & activity ----------

function activityView() {
  const events = state.events.filter(e => state.actor === 'all' || e.actor === state.actor);
  const head = pageHead(t('activityTitle'), t('activityLead'));
  const filters = h('div', { class: 'filters', role: 'radiogroup', 'aria-label': t('activityTitle') },
    ['all', 'web', 'cli', 'mcp'].map(actor => h('label', { class: 'segment' },
      h('input', { type: 'radio', name: 'actor', checked: state.actor === actor, onchange: () => { state.actor = actor; render(); } }),
      h('span', null, actor === 'all' ? t('actorAll') : t('actors.' + actor)))),
    h('span', { class: 'right' }, t('latestN', { n: state.events.length })),
    h('button', { class: 'button small', type: 'button', onclick: load }, svg(ICON.refresh), h('span', { class: 'sr-only' }, 'refresh')));
  const rows = events.map(e => h('div', { class: 'table-row', role: 'row' },
    h('span', { class: 'small muted', role: 'cell' }, time(e.at)),
    h('span', { role: 'cell' }, h('span', { class: 'pill actor-' + e.actor }, t('actors.' + e.actor))),
    h('span', { class: 'stacked', role: 'cell' }, h('b', null, t('actions.' + e.action)), h('span', { class: 'mono small muted ellipsis' }, e.subject)),
    h('span', { class: 'result', role: 'cell' }, e.action === 'probe' && STRINGS.en.status[e.summary] ? pill(e.summary) : h('span', { class: 'small muted' }, e.summary))));
  const log = h('section', { class: 'panel' }, filters, h('div', { class: 'scroll-x' }, h('div', { class: 'events', role: 'table', 'aria-label': t('activityTitle') },
    rows.length ? rows : h('p', { class: 'empty' }, t('noEvents')))));
  return [head, h('div', { class: 'split' }, h('div', { class: 'main-col' }, agentPanel(), log), h('aside', { class: 'side-col' }, dataPanel()))];
}

function agentPanel() {
  const info = state.info || {};
  const exe = info.executable || '/path/to/device-deck';
  const homeArgs = info.data_dir && !isDefaultHome(info.data_dir) ? ['--home', info.data_dir] : [];
  const args = [...homeArgs, 'mcp'];
  const lastMcp = state.events.find(e => e.actor === 'mcp');
  const tools = ['device_deck_list_devices', 'device_deck_get_device', 'device_deck_connection_plan', 'device_deck_probe_device'];
  const skillTone = { linked: 'good', other: 'good', missing: 'warn' };
  return h('section', { class: 'panel pad' },
    h('div', null, h('h2', null, t('agents')), h('p', { class: 'small muted' }, t('agentsLead'))),
    h('div', { class: 'stack tight' },
      h('div', { class: 'agent-row' }, h('span', { class: 'dot tone-' + (lastMcp ? 'good' : 'none') }), h('b', null, t('lastAgent')), h('span', null, lastMcp ? time(lastMcp.at) : t('never'))),
      (info.skill || []).map(s => h('div', { class: 'agent-row', title: s.path }, h('span', { class: 'dot tone-' + (skillTone[s.state] || 'bad') }),
        h('b', null, 'Skill · ' + t('agentName.' + s.agent)), h('span', null, t('skillState.' + s.state))))),
    !info.executable && h('p', { class: 'hint error' }, t('executableMissing')),
    h('h3', null, t('installSkill')),
    codeBlock([exe, 'skill', 'install'].map(shellQuote).join(' ')),
    h('h3', null, t('claudeCode')),
    codeBlock(['claude', 'mcp', 'add', '--scope', 'user', 'device-deck', '--', exe, ...args].map(shellQuote).join(' ')),
    h('h3', null, t('codex')),
    codeBlock('[mcp_servers.device-deck]\ncommand = ' + JSON.stringify(exe) + '\nargs = ' + JSON.stringify(args).replace(/,/g, ', ')),
    h('p', { class: 'small muted' }, t('restartHint')),
    h('h3', null, t('tools')),
    h('div', { class: 'stack' }, tools.map(name => h('div', { class: 'tool-row' }, h('span', null, t('toolList.' + name)), h('code', { class: 'small muted' }, name),
      h('span', { class: 'pill ' + (name.endsWith('probe_device') ? 'tone-warn' : 'tone-good') }, name.endsWith('probe_device') ? t('probeTool') : t('readOnlyTool'))))));
}

function isDefaultHome(dir) {
  return /\/\.local\/share\/device-deck$/.test(dir);
}

function dataPanel() {
  const info = state.info || {};
  const retention = info.retention || {};
  return h('section', { class: 'panel pad' }, h('h2', null, t('localData')),
    h('dl', { class: 'facts' },
      h('dt', null, t('dataDir')), h('dd', { class: 'mono small' }, info.data_dir || '—'),
      h('dt', null, t('database')), h('dd', { class: 'mono small' }, info.database || '—'),
      h('dt', null, t('permissions')), h('dd', null, t('permissionsValue')),
      h('dt', null, t('retention')), h('dd', null, t('retentionValue', { o: retention.observations_per_endpoint ?? '—', e: retention.events ?? '—' }))),
    h('div', { class: 'actions' }, h('a', { class: 'button', href: '/api/export', download: 'device-deck-inventory.json' }, svg(ICON.download), t('exportInventory'))),
    h('p', { class: 'small muted' }, t('exportHelp')),
    info.database && [h('h3', null, t('backup')), codeBlock('sqlite3 ' + shellQuote(info.database) + ' ".backup ' + "'device-deck-backup.sqlite'" + '"')]);
}

// ---------- Boot ----------

function selectFromRoute() {
  const { parts, params } = route();
  if ((parts[0] || 'devices') === 'devices' && params.get('device')) state.selected = params.get('device');
}
window.addEventListener('hashchange', () => {
  if (!/^#\/devices\/(new|[^/]+\/edit)/.test(location.hash)) state.draft = null;
  selectFromRoute();
  render();
  document.getElementById('view').focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
document.addEventListener('keydown', event => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target.closest('input, textarea, select, [contenteditable], dialog')) return;
  const search = document.getElementById('device-search');
  if (search) { event.preventDefault(); search.focus(); search.select(); }
});
document.getElementById('language').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem('device-deck-language', language); } catch { /* storage unavailable */ }
  renderChrome();
  render();
});
document.getElementById('credential-form').addEventListener('submit', submitProfile);
for (const button of document.querySelectorAll('#credential-dialog .close')) button.addEventListener('click', () => document.getElementById('credential-dialog').close());
setInterval(() => { for (const el of document.querySelectorAll('time[datetime]')) el.textContent = relative(el.getAttribute('datetime')); }, 30000);
selectFromRoute();
renderChrome();
load();
