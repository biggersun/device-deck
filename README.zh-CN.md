# DeviceDeck

**把你的电脑、NAS、路由器和测试手机登记在一个本机私有清单里，你、命令行和 AI 编程 Agent 看到的是同一份。**

[English](README.md) · [方案说明](docs/plan.zh-CN.md) · [管理流程](docs/management.md) · [Agent 接入](docs/agents.md) · [安全说明](SECURITY.md)

![DeviceDeck 控制台：设备、入口、最近检查状态和资源详情](docs/images/console-zh.png)

## 解决什么问题

家里有 NAS、路由器、几台电脑，再加上开发用的 Android 和 iPhone，关于它们的信息散落在各处：

- **地址到处都是。** 有的在 `~/.ssh/config`，有的在路由器 DHCP 页面、Tailscale 后台、`adb devices`，或者手机备忘录里。同一台 NAS 在家用局域网 IP，在外用 Tailscale IP，每次都要重新想该走哪条。
- **"在线吗"靠猜。** 一次旧的 ping 结果、某个面板上的绿点，都不代表你现在真的能登录。IP 漂移之后，同一个地址可能已经是另一台机器。
- **Agent 每次从零开始。** Claude Code、Codex 一上来就问 "NAS 的 IP 是多少"；你只好把主机名、用户名贴进提示词和记忆文件，最糟的是把密码贴进对话。
- **手机是另一套体系。** Android 要授权过的 ADB 序列号，iPhone 要信任过的 UDID，WebDriverAgent 还得单独跑着。SSH 配置管不到这些。

DeviceDeck 做的就是一份小而可靠的本机清单。人、CLI 和 MCP 读的是同一份数据，而且它从不保管任何密码或私钥。

## 怎么解决

- **一台设备，多个入口。** 设备 ID 固定不变，局域网、Tailscale、远程、USB 都是它下面的入口。检查时由你明确选择走哪条路，系统不会悄悄换路。
- **只登记登录方式，不存秘密。** 记录的是 "怎么登录"：私钥路径、ssh-agent、手动输入的密码、ADB 配对、iOS 信任或 WDA 访问。数据模型直接拒绝密码、私钥内容和配对码字段，秘密始终留在钥匙串、ssh-agent 和手机里。
- **区分"能连上"和"连对了"。** 每次检查都是固定的只读探测。SSH 会在严格主机公钥校验下，核对远端机器名和账号与登记是否一致。结果会明确分开以下四种情况：
  - 已验证：机器名和账号都对得上。
  - 可达但身份未确认：有设备响应，但无法确认身份。
  - 需校验主机公钥：主机公钥还没有经过你的核对。
  - 设备身份不匹配：响应的是另一台机器或另一个账号。
- **状态说实话。** 每条结果都带采集时间；拿不到的指标显示 "未知"，不会当成 0。Linux 区分空闲内存和可用内存，macOS 不会把 APFS 卷重复累加。
- **为 Agent 设计。** 用官方 MCP Python SDK 提供本机 stdio 服务，只开放四个工具：列设备、读设备、取连接方案、做一次检查。没有任意命令执行，没有自动配对，也不读取任何秘密。另附一份可移植的 `SKILL.md`。
- **好用的本地控制台。** 包括：
  - 状态总览和设备 → 入口表格；
  - 针对每种失败的下一步提示；
  - 按协议切换字段的编辑器，带实时命令预览；
  - 可一键复制的连接方案；
  - 网页、命令行、Agent 的操作审计。

  界面支持中英文、浅色和深色主题，无需构建，也不依赖任何 CDN。

## 快速开始

需要 Python 3.11+ 和 [uv](https://docs.astral.sh/uv/)，支持 macOS 和 Linux。

```bash
uv tool install git+https://github.com/biggersun/device-deck
device-deck serve
```

打开 **http://127.0.0.1:8765**，按以下顺序操作：

1. 先登记一种登录方式，例如 "SSH 私钥 → `~/.ssh/id_ed25519`"。
2. 添加设备和它的入口。
3. 点 "检查"。

数据默认保存在 `~/.local/share/device-deck/`（目录权限 700，数据库 600），可以用 `DEVICE_DECK_HOME` 或 `--home` 改到别的位置。

## 接入 Agent

```bash
claude mcp add device-deck -- "$(command -v device-deck)" mcp
```

Codex 的写法见 [docs/agents.md](docs/agents.md)。控制台 "活动与接入" 页面会直接给出带本机路径的命令。

接入后可以直接问：

- "通过局域网检查一下 NAS 的内存和磁盘"
- "测试用的 Android 手机怎么连？"
- "我有哪些设备需要处理？"

## 当前状态

v0.1 是单用户早期版本，已在真实的 macOS、Linux 和 BusyBox SSH 设备上日常使用。Android 和 iOS 目前只有协议样例测试，还没做真机验收。设备操作、自动配对、密码库读取和远程多用户访问都刻意不在范围内。后续计划见 [TODO.md](TODO.md)。

MIT 协议，欢迎贡献，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。
