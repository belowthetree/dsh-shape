# dsh-shape 演示视频

22 秒、1920×1080、30fps 的功能演示，叙事是「轻量化扩展形态 → 两种即时用法」：

| 时间 | 内容 |
| --- | --- |
| 0–3s | 片头：dsh 的轻量化扩展形态，旨在即时自定义界面和功能 |
| 3–9.8s | 输入提示「做一个 MCP 管理器浮窗」→ 直接生成可用的浮窗 |
| 9.8–18.6s | `Ctrl + .` 打开形态面板 → 点开 MCP 管理器卡片，进入形态自己的界面 |
| 18.6–22s | 片尾：安装命令与能力清单 |

| 文件 | 说明 |
| --- | --- |
| `dsh-shape-demo.mp4` | 成片，H.264 / yuv420p / faststart |
| `dsh-shape-demo.gif` | 720px、12fps 的预览图，用于 README 内嵌 |
| `poster.png` | 封面帧（片头第 2 秒） |
| `demo.html` | 动画源文件，所有画面由时间轴函数生成 |
| `record.mjs` | 用 Playwright 逐帧截图，得到确定性帧序列 |

## 重新生成

```sh
# 1. 抓帧（约 1.5 分钟，输出 PNG 序列）
node demo/record.mjs demo/.frames

# 2. 编码
ffmpeg -y -framerate 30 -i demo/.frames/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  demo/dsh-shape-demo.mp4

# 3. 预览 GIF
ffmpeg -y -framerate 30 -i demo/.frames/f%04d.png \
  -vf "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" \
  demo/dsh-shape-demo.gif

# 4. 封面帧（片头第 2 秒）
cp demo/.frames/f0060.png demo/poster.png
```

`record.mjs` 通过 `createRequire('E:/Project/deepseek-harness/package.json')` 解析 Playwright，用 `SHAPE_CHROME` 环境变量可以指定 Chromium 可执行文件；换成自己的路径即可在其他机器上复现。

> 若 ffmpeg 报 `Permission denied` 写不进 `demo/`（Windows 受控文件夹访问会拦新下载的可执行文件），先输出到临时目录再拷贝即可。

## 改内容

`demo.html` 里每个场景是一个 `<section class="scene">`，内部动画全部按「场景内已用时间」编写；场景的时间轴集中在两处：

```js
const scenes = { s1: [0, 5000], s2: [5000, 16000], ... }   // 原始编排
const SPAN = { s1: 3000, s2: 6800, s3: 8800, s4: 3400 }    // 成片时长（毫秒）
```

改 `SPAN` 就能整体收紧节奏，不必逐个调整场景里的毫秒值——`render()` 会把新时钟按比例映射回原始编排再渲染。要改动画本身，仍按原时间轴改 `renderSource()`。

页面只暴露一个入口 `window.__seek(ms)`，渲染完全由时间决定、不依赖 `setTimeout` 或 CSS 动画，所以抓帧和编码不会出现抖动。改完直接重跑 `record.mjs` 即可；成片总时长由 `SPAN` 之和决定，`record.mjs` 里的 `DURATION_MS` 要同步。
