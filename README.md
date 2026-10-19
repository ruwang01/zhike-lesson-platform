# 知课－教案生成平台

国际中文教学的备课工作台，使用标准 Next.js App Router。包含知识图谱账号连接与原文核验、教案生成及修订、Word 导出、图谱例句文字卡、管理员分配账号、使用统计与按用户隔离的教案历史。

## 开发与构建

使用 Node.js 22.13 以上版本、pnpm 10。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm test:integration
pnpm start
```

页面入口为 `app/page.tsx`，后端功能位于 `app/api/`。构建输出由 Next.js 管理，无需指定静态输出目录。本仓库不包含平台专用部署脚本或服务端资源配置。

## 功能配置

复制 `.env.example` 为 `.env.local`，填写自己的配置。所有密钥仅在服务端使用，不提交 GitHub。

账号、会话、管理员统计及教案历史需要持久化 SQLite/libSQL 数据库。`DATABASE_URL` 支持远程 libSQL/Turso；本地开发可用 `file:local.db`，线上不能用临时本地文件保存用户数据。配置后运行 `pnpm db:migrate` 创建表；迁移可重复执行。

`AUTH_BASE_URL` 填网站实际网址。`BETTER_AUTH_SECRET`、`SESSION_SECRET` 使用各自至少32位随机值。设置至少32位的 `ADMIN_SETUP_SECRET` 后，可从可信客户端向 `/api/admin/setup` 发送 JSON（username、name、password），并通过 `X-Setup-Secret` 请求头提供初始化密钥、`Origin` 请求头提供本站网址。账号为 admin，密码12–128位。只允许首次成功初始化，完成后移除初始化密钥。管理员可分配和停用教师账号；没有开放注册。不要将密码放入命令行、URL或源码。

文字模型使用 `DEEPSEEK_API_KEY`；也保留可配置模型接口。未配置时模板编辑和本地导出可用，模型生成显示未配置状态。图谱查询需要各自获批的图谱账号。图谱原文和 AI 教学设计分别展示，教师需审核生成内容。

图片生成暂未启用，`IMAGE_API_KEY` 留空；例句文字卡下载无需图片 API。语音功能未开放。邮件服务未配置时，不提供邮件找回密码，由管理员重置。

数据库未配置时首页仍可访问，账号和云端历史明确返回服务未配置，不会使用虚假的登录或历史数据。原平台上的数据库和账号不会自动迁移。
