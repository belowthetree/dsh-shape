# dsh-shape 文档

面向使用者和贡献者的补充文档。项目概览、安装和演示见[根目录 README](../README.md)。

## 从这里开始

| 文档 | 读它是为了 |
| --- | --- |
| [架构](architecture.md) | 宿主插件、客户端 bundle、形态加载和能力系统是怎么拼起来的 |
| [形态目录](shapes.md) | 一个形态由哪些文件组成，清单字段怎么填 |
| [能力参考](capabilities.md) | 10 个内置能力的方法签名、返回值与失败行为 |
| [开发与发布](development.md) | 本地联调、发布前的三道检查、版本与包结构 |
| [已知问题](known-issues.md) | 当前不可用的 API 和踩过的坑 |

## 一句话版本

dsh-shape 是 DSH 插件，把「一个目录 + 一份清单 + 可选脚本」变成可以即时启停的界面扩展：形态可以有自己的视图、在 10 个会话槽位里渲染内容、注册快捷键、读写自己的 `data/` 目录，并通过 10 个能力访问宿主功能。

## 技能（skills/ 与 .dsh/skills/）

两份 skill，装在不同层：

| 位置 | 给谁用 | 谁看得到 |
| --- | --- | --- |
| `skills/shape-development/` | 在形态目录里**写形态**的 agent | 随包发布，Shape Studio 预设经 `skill.js` 注册，只有该预设可见 |
| `skills/shape-playbook/` | 要动手做形态的 agent（各类形态的已验证流程），以及遇到「UI 不出现、快捷键不触发、搜索不到、预设消失」时 | 同上，由 `skill.js` 一并注册；正文可按 `shape_spec` 的 `playbook*` 主题读取 |
| `.dsh/skills/dsh-shape-contribution/` | **改这个包本身**的 agent（宿主插件、bundle、预设、工具、发布） | DSH 的**项目级** skill 目录：在本仓库里工作时，任何预设的 agent 都能用 |

`.dsh/skills/` 是 DSH 扫描的项目技能根（`<projectRoot>/.dsh/skills`），不需要安装命令；想让它在别的项目里也可用，再复制到 `$DSH_HOME/skills/` 或 `~/.agents/skills/`。

## 版本

- 包名：`@belowthetree/dsh-shape`
- 当前版本：`0.4.31`
- 能力 ABI：`apiVersion: 1`
