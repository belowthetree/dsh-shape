# dsh-shape 演示

28 秒、1920×1080、30fps 的真机宣传片。**本目录只存 GIF 预览和封面，不存成片视频**；成片由
[dsh-reel](https://github.com/belowthetree/dsh-reel) 的 V0.1 管线生成，留在那边的 `studio/out/`。

| 时间 | 内容 |
| --- | --- |
| 0–3s | 终端输入 `dsh` |
| 3–5s | 体素鲸鱼拼合 + 喷水 |
| 5–9s | 鲸鱼依次跳 文件 → Git → DSH 图标，进入 DSH 窗口 |
| 9–12s | DSH 主界面 → 插件页展开 |
| 12–15s | 搜索 `@belowthetree/dsh-shape` → 结果卡 → 安装 → 蓝色进度 → 已安装 |
| 15.4–26s | 四个功能页：形态面板 / 源码工作台 / 工作区切换 / 对话内搜索 |
| 26–28s | 片尾：`DSH PLUGIN · SHAPE` + 名称 / 包名 / 一句话 / 安装命令 / 许可·仓库 |

| 文件 | 说明 |
| --- | --- |
| `dsh-shape-demo.gif` | 演示预览，720×405 / 10fps / 280 帧，由成片转出 |
| `poster.png` | 封面图，成片 16.5s 帧（1920×1080） |
| `demo.html`、`record.mjs` | 上一版 22 秒矢量化动画的源文件，不是当前成片的来源 |

## 成片怎么来的（V0.1 真机管线）

案例：`dsh-reel/cases/v01/dsh-shape.json`。四张功能截图取自运行中的 GUI，来源见
`dsh-reel/studio/public/shots/dsh-shape/SOURCES.md`。以下命令都在 dsh-reel 仓库里执行：

```sh
# 1) 案例 JSON → comp + 四张功能页 + 音效时间轴
node tools/v01-film/make-v01-film.mjs cases/v01/dsh-shape.json --workdir .research/onetake-promo

# 2) 28s 混音（66 个音效事件 + music bed）
python studio/scripts/make_sfx_v2.py \
  --timeline studio/src/v2/data/v01-dsh-shape-timeline.ts \
  --music studio/public/audio/v2/music-bed-30.wav \
  --duration 28 --total-frames 840 \
  --mix studio/out/dsh-shape-v01-mix.wav --manifest /tmp/dsh-shape-audio-manifest.json

# 3) 渲染 840 帧（自带渲染器，不需要 Onetake）
node tools/v01-film/render-frames.mjs .research/onetake-promo/comp-dsh-shape.html \
  --out .research/onetake-promo/promo-dsh-shape-intro-1080.mp4 \
  --width 1920 --height 1080 --fps 30 --workers 4 --shutter 180

# 4) 混流 + 封面（产物在 dsh-reel/studio/out/，不进本仓库）
ffmpeg -y -i .research/onetake-promo/promo-dsh-shape-intro-1080.mp4 -i studio/out/dsh-shape-v01-mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -movflags +faststart -t 28 \
  studio/out/promo-dsh-shape-intro-1080.mp4
ffmpeg -y -ss 16.5 -i studio/out/promo-dsh-shape-intro-1080.mp4 -frames:v 1 \
  studio/out/promo-dsh-shape-intro-poster.png
```

## GIF 预览怎么生成

从 dsh-reel 的成片转出，写到本目录：

```sh
ffmpeg -y -i ../dsh-reel/studio/out/promo-dsh-shape-intro-1080.mp4 \
  -vf "fps=10,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=32[p];[b][p]paletteuse=dither=none" \
  demo/dsh-shape-demo.gif
```

> 成片是 3D 体素 + 实拍界面质感，GIF 比上一版矢量动画大得多；720px / 10fps / 32 色 / 无抖动是体积与可读性的折中。

## 旧版动画（demo.html）

`demo.html` 与 `record.mjs` 只作为历史参考保留：22 秒矢量化动画，每个场景是一个 `<section class="scene">`，
动画全部由时间轴函数生成，页面只暴露 `window.__seek(ms)`；`record.mjs` 用 Playwright 逐帧截图。
重新出片时输出到临时目录，不要写回本仓库：

```sh
node demo/record.mjs /tmp/shape-frames
ffmpeg -y -framerate 30 -i /tmp/shape-frames/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart /tmp/dsh-shape-old.mp4
ffmpeg -y -framerate 30 -i /tmp/shape-frames/f%04d.png \
  -vf "fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" \
  /tmp/dsh-shape-old.gif
```

改内容仍按 `demo.html` 的两处时间轴：`scenes`（原始编排）与 `SPAN`（成片时长，改它即可整体收紧节奏，
`record.mjs` 的 `DURATION_MS` 要同步）。`record.mjs` 通过 `createRequire('E:/Project/deepseek-harness/package.json')`
解析 Playwright，用 `SHAPE_CHROME` 指定 Chromium 可执行文件，换机器时改成自己的路径。
