# 翡翠战境官网

《我的世界》Java 1.8—26.3 服务器官网，使用原生 HTML、CSS 和 JavaScript 构建。

- 官网：<https://ben12350.github.io/emerald-frontier-website/>
- 服务器：`mauritania-replies.tun.ply.gg`
- 局域网动态站：<http://192.168.101.17:18088/>

## 页面功能

- 响应式桌面与手机布局
- 原创体素竞技场视觉和粒子动画
- 一键复制服务器地址
- PVP 邀请流程、经济、领地与服务器指令介绍
- 每 10 秒更新服务器在线人数、TPS 和运行状态
- GitHub Pages 使用三路状态 API 回退，任一接口在线即可正确显示
- Open Graph、Twitter 大图、canonical、robots 和 sitemap
- 桌面与 390px 手机布局自动回归

## 本地运行

网络版通过桥接访问虚拟机动态站：

```text
http://192.168.101.17:18088/
```

本地动态版由 `server.py` 提供 `/api/status`，并显示备份、恢复证明、主机磁盘、
异地副本和服务器安全状态。公网仓库按用户要求不包含 `server.py` 与启动脚本。

## GitHub Pages

推送到 `main` 分支后，`.github/workflows/pages.yml` 自动部署。
Pages 使用 `mcstatus.io`、`mcsrvstat.us` 和 `mcapi.us` 三接口并行回退；
无性能数据时 TPS/MSPT 显示 `--`。

## 文件

- `index.html`：页面结构
- `style.css`：完整视觉样式
- `app.js`：状态刷新、复制地址、粒子和滚动动画
- `server.py`：本地动态状态服务器
- `robots.txt`、`sitemap.xml`：搜索引擎收录
- `og-image.png`：1200×630 分享预览图
