# 翡翠战境官网

《我的世界》Java 1.8—26.3 服务器官网，使用原生 HTML、CSS 和 JavaScript 构建。

## 页面功能

- 响应式桌面与手机布局
- 原创体素竞技场视觉和粒子动画
- 一键复制服务器地址
- PVP 邀请流程、经济、领地与服务器指令介绍
- 每 10 秒更新服务器在线人数、TPS 和运行状态

## 本地运行

Windows 双击 `启动官网.bat`，然后访问：

```text
http://127.0.0.1:8088
```

本地版由 `server.py` 提供 `/api/status` 动态接口。

## GitHub Pages

推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动部署静态页面。
GitHub Pages 版通过公开服务器状态 API 获取在线人数；TPS 只在本地动态接口可用时显示。

## 文件

- `index.html`：页面结构
- `style.css`：完整视觉样式
- `app.js`：状态刷新、复制地址、粒子和滚动动画
- `server.py`：本地动态状态服务器
