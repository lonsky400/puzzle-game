# 发布到公网（最简单方式）

项目已配置 **GitHub Pages**，按下面做即可用公网链接访问。

## 步骤

1. **推送代码**  
   确保改动已推送到 `main` 或 `master` 分支：
   ```bash
   git add -A && git commit -m "deploy" && git push origin main
   ```
   若默认分支是 `master`，把上面命令里的 `main` 改成 `master`。

2. **开启 GitHub Pages**（只需做一次）  
   - 打开仓库：<https://github.com/lonsky400/puzzle-game>  
   - **Settings** → 左侧 **Pages**  
   - **Build and deployment** 里 **Source** 选 **GitHub Actions**  
   - 保存（无需改其它选项）

3. **等部署完成**  
   - 打开 **Actions** 标签，看到 “Deploy to GitHub Pages” 跑绿即可  
   - 公网访问地址：
     ```
     https://lonsky400.github.io/puzzle-game/
     ```

之后每次推送到 `main`/`master` 都会自动重新部署，无需额外操作。
