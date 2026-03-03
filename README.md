# my-electron-app

内部使用的 Electron 桌面应用，基于 Electron Forge。

## 本地打包

- Windows 安装包：`npm run make:win`
- macOS 安装包：`npm run make:mac`
- 通用打包：`npm run make`

产物默认在 `out/make`。

## GitHub Actions 发布

项目已提供工作流：`.github/workflows/release.yml`。

触发方式：

1. 推送到 `master` 分支会自动触发
2. 或在 GitHub Actions 页面手动触发 `Build and Release Electron App`

工作流会：

- 在 Windows / macOS 构建安装产物
- 汇总产物并发布到对应的 GitHub Release
- 每次按 `主版本.次版本.GITHUB_RUN_NUMBER` 生成唯一版本并自动打 tag（例如 `v1.0.25`）
- 自动关闭签名自动发现（`CSC_IDENTITY_AUTO_DISCOVERY=false`），无需代码签名

## 应用更新逻辑

应用在**打包后启动**时会自动检查 GitHub 最新 Release：

- 若发现比当前版本更新的标签（例如当前 `1.0.0`，最新 `v1.0.1`）
- 弹窗提示并可一键打开 Release 页面下载安装

更新检查依赖 `package.json` 里的 `repository.url`，请确保它指向实际仓库。
