# 从 GitHub 公开部署知课

仓库名称为“知课－教案生成平台”，路径 zhike-lesson-platform。它包含服务端、Cloudflare D1 数据库和私有密钥，GitHub Pages 只能运行静态页面，因此不能承载此完整应用。

## 一、准备 Cloudflare

1. 登录自己的 Cloudflare 账号，启用 Workers，确认 Workers 子域名。创建一个 D1 数据库，例如 zhike-lessons，记下数据库 ID 和账号 ID。不要用本地占位数据库 ID。
2. 确认正式网址，例如 https://zhike-lesson-platform.你的子域名.workers.dev；也可绑定你自己的域名。
3. 在 Cloudflare 中从 GitHub 导入 ruwang01/zhike-lesson-platform，选择 main 分支。也可在可信本地终端安装依赖、构建并通过 Wrangler 登录发布。

## 二、构建与发布

Node >=22.13，项目使用 pnpm。先安装依赖，再执行 pnpm build。

构建环境设置下面三个值（它们不是 API 密钥）：

- CF_ACCOUNT_ID：Cloudflare 账号 ID。
- CF_D1_DATABASE_ID：正式 D1 数据库 ID。
- CF_PUBLIC_URL：正式 HTTPS 网址，不带路径。

随后运行：

```sh
node scripts/prepare-cloudflare.mjs
pnpm exec wrangler d1 migrations apply DB --remote --config dist/server/wrangler.public.json
pnpm exec wrangler deploy --config dist/server/wrangler.public.json
```

GitHub 自动构建方式中，构建命令为 `pnpm build && node scripts/prepare-cloudflare.mjs`，部署命令为上面两条 wrangler 命令。Cloudflare Build 环境应提供发布所需的账号权限。迁移命令使用 D1 的迁移记录避免重复应用，不能把本地数据库文件提交或上传。

## 三、运行时密钥

在 Workers 的运行时变量与密钥中配置，不写入 GitHub：

- BETTER_AUTH_SECRET：至少32位随机字符串。
- SESSION_SECRET：至少32位随机字符串。
- DEEPSEEK_API_KEY、DEEPSEEK_MODEL：文字模型；默认 deepseek-flash。
- IMAGE_API_KEY：火山引擎图片密钥。
- IMAGE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
- IMAGE_MODEL=doubao-seedream-5-0-pro-260628
- IMAGE_PROVIDER=volcengine
- IMAGE_SIZE=2K
- IMAGE_FORMAT=b64_json

AUTH_BASE_URL 由生成的配置设为 CF_PUBLIC_URL。当前版本不开放语音 API。正式环境与本地数据库分开，本地账号、历史、生成文件不会自动迁移。

## 四、建立正式管理员

首次设置一个随机 ADMIN_SETUP_SECRET（至少32位）为运行时密钥。从可信终端向正式域名的 /api/admin/setup 发 POST：Origin 是正式域名，Content-Type 为 application/json，X-Setup-Secret 为该密钥，JSON 正文为 username/name/password。账号使用 admin，密码12–128位。不要把密码或初始化密钥放进 URL、GitHub、终端历史或聊天；应从本机受限文件读取或交互式输入。服务器仅允许首次成功初始化。

初始化后移除 ADMIN_SETUP_SECRET，再用管理员账号登录并分配教师账号。原图谱仍需每人使用自己获批的图谱账号。

## 五、验收

验证：管理员登录、普通账号无法访问管理员接口、图谱登录与原文确认、真实教案生成、真实图片生成、Word 下载、云端历史隔离。检查正式页面未暴露凭据。完成后将正式网址分享给教师。

本文件是部署步骤，不表示网站已经上线；实际发布结果以 Cloudflare 返回的网址及线上验证为准。
