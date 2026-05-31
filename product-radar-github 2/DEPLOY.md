# 发布选品雷达

## 上传 GitHub

### 一键上传

1. 安装并登录 GitHub CLI：

```bash
brew install gh
gh auth login
```

2. 双击 `publish-to-github.command`。

脚本会在你的 GitHub 账号下创建公开仓库 `product-radar` 并上传文件。

### 网页上传

也可以打开 [GitHub New Repository](https://github.com/new)，创建名为 `product-radar` 的公开仓库，然后将当前目录中的文件上传。

## 生成公开网站

GitHub 仓库用于存放代码。由于选品雷达包含 Node.js 接口，不能只用 GitHub Pages。

1. 登录 [Render](https://dashboard.render.com/)。
2. 创建 Blueprint。
3. 选择 GitHub 中的 `product-radar` 仓库。
4. Render 会读取 `render.yaml` 并生成公开网站。

部署完成后的分享链接格式：

```text
https://product-radar.onrender.com/radar/
```

如果 Render 分配了带随机后缀的域名，请以 Render 页面显示的域名为准。
