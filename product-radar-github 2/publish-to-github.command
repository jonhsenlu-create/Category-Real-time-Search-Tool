#!/bin/zsh
set -e
cd "$(dirname "$0")"

if ! command -v gh >/dev/null 2>&1; then
  echo "尚未安装 GitHub CLI。请先运行：brew install gh"
  read "?按回车键关闭..."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "尚未登录 GitHub。请先运行：gh auth login"
  read "?按回车键关闭..."
  exit 1
fi

GITHUB_LOGIN="$(gh api user --jq .login)"
git config user.name "${GITHUB_LOGIN}"
git config user.email "${GITHUB_LOGIN}@users.noreply.github.com"

if [ ! -d .git ]; then
  git init -b main
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "Publish product radar"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create product-radar --public --source=. --remote=origin --push
else
  git push -u origin "$(git branch --show-current)"
fi

echo ""
echo "GitHub 上传完成："
gh repo view --web
