# Movie-Plus

<div align="center">
  <img src="public/logo.svg" alt="Movie-Plus Logo" width="120">
</div>

> 🎬 **Movie-Plus** 是一个影视聚合播放器，支持多源搜索、在线播放、弹幕系统、TMDB 影视数据等。

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 🚀 部署

### Cloudflare Workers 部署

#### 前置要求
1. Cloudflare 账号
2. Fork 本项目到 GitHub

#### 配置 Secrets

进入 Settings → Secrets and variables → Actions，添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需要 Workers Scripts Edit + D1 Edit 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `USERNAME` | 站长账号 |
| `PASSWORD` | 站长密码 |
| `NEXT_PUBLIC_STORAGE_TYPE` | 填 `d1` |
| `D1_DATABASE_ID` | D1 数据库 ID |

#### 触发部署
Actions → Deploy to Cloudflare → Run workflow

---

### Docker 部署

```yaml
services:
  movie-core:
    image: ghcr.io/levin201/movie-plus:latest
    container_name: movie-core
    restart: on-failure
    ports:
      - '3000:3000'
    environment:
      - USERNAME=admin
      - PASSWORD=your_password
      - NEXT_PUBLIC_STORAGE_TYPE=kvrocks
      - KVROCKS_URL=redis://movie-kvrocks:6666
    networks:
      - movie-network
    depends_on:
      - movie-kvrocks
  movie-kvrocks:
    image: apache/kvrocks
    container_name: movie-kvrocks
    restart: unless-stopped
    volumes:
      - kvrocks-data:/var/lib/kvrocks/db
    networks:
      - movie-network
networks:
  movie-network:
    driver: bridge
volumes:
  kvrocks-data:
```

---

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `USERNAME` | 站长账号 | 必填 |
| `PASSWORD` | 站长密码 | 必填 |
| `NEXT_PUBLIC_STORAGE_TYPE` | 存储类型（d1/kvrocks/redis/upstash） | d1 |
| `NEXT_PUBLIC_SITE_NAME` | 站点名称 | Movie |
| `TMDB_API_KEY` | TMDB API 密钥 | 空 |
| `CRON_PASSWORD` | 定时任务密码 | 空 |
| `ENABLE_TV_MODE` | 启用电视模式 | true |
| `CONFIG_SUBSCRIPTION_URL` | 视频源配置订阅地址 | 空 |

---

## 📝 配置视频源

部署后为空壳应用，需在管理面板中配置视频源：
1. 登录管理后台
2. 配置订阅 → 填入视频源 URL → 获取
3. 或在配置文件直接编辑 JSON

---

## ⚠️ 声明

本项目仅供学习使用，请勿用于商业用途或公开传播。用户需自行承担使用风险。

