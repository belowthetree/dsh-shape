# dsh-shape 演示视频

36 秒、1920×1080、30fps 的功能演示，叙事是「轻量化扩展形态 → 两种即时用法」：

| 时间 | 内容 |
| --- | --- |
| 0–5s | 片头：dsh 的轻量化扩展形态，旨在即时自定义界面和功能 |
| 5–16s | 输入提示「做一个 MCP 管理器浮窗」→ 直接生成可用的浮窗 |
| 16–30.5s | `Ctrl + .` 打开形态面板 → 点开 MCP 管理器卡片，进入形态自己的界面 |
| 30.5–36s | 片尾：安装命令与能力清单 |

| 文件 | 说明 |
| --- | --- |
| `dsh-shape-demo.mp4` | 成片，H.264 / yuv420p / faststart |
| `dsh-shape-demo.gif` | 720px、12fps 的预览图，用于 README 内嵌 |
| `poster.png` | 封面帧 |
| `demo.html` | 动画源文件，所有画面由时间轴函数生成 |
| `record.mjs` | 用 Playwright 逐帧截图，得到确定性帧序列 |

## 重新生成

```sh
# 1. 抓帧（约 3 分钟，输出 PNG 序列）
node demo/record.mjs .frames

# 2. 编码
ffmpeg -y -framerate 30 -i .frames/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  demo/dsh-shape-demo.mp4

# 3. 预览 GIF
ffmpeg -y -framerate 30 -i .frames/f%04d.png \
  -vf "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" \
  demo/dsh-shape-demo.gif

# 4. 封面帧（片头第 3 秒）
cp .frames/f0090.png demo/poster.png
```

`record.mjs` 通过 `createRequire('E:/Project/deepseek-harness/package.json')` 解析 Playwright，用 `SHAPE_CHROME` 环境变量可以指定 Chromium 可执行文件；换成自己的路径即可在其他机器上复现。

## 改内容

`demo.html` 里每个场景是一个 `<section class="scene">`，时间轴集中在脚本的 `scenes` 表：

```js
const scenes = { s1: [0, 4200], s2: [4200, 11500], ... }
```

页面只暴露一个入口 `window.__seek(ms)`，渲染完全由时间决定、不依赖 `setTimeout` 或 CSS 动画，所以抓帧和编码不会出现抖动。改完直接重跑 `record.mjs` 即可。
