# GitHub Pages 部署交接

- 项目根目录：`/Users/xinwei/大健康代理商管理原型`
- GitHub 仓库：<https://github.com/xinwei5282-sys/big-health-agent-demo>
- GitHub Pages：<https://xinwei5282-sys.github.io/big-health-agent-demo/>
- 发布分支：`main`；`.github/workflows/pages.yml` 在推送和手动触发时构建并部署静态页面。
- 演示数据真源：`src/business-demo-data.ts`；最近生成的门店/集团经营诊断、团队分析和顾客方案快照：`src/ai-demo-snapshots.ts`。新访客以这些快照为默认展示，浏览器本地保存的更新优先。
- Pages 只托管静态文件。`server.mjs` 需要单独部署到支持 Node.js 的服务，并配置 `VITE_AI_API_URL`，否则线上“重新生成”及新 AI 分析不可用；API Key 不得放入前端或仓库。
- 最近部署：commit `9fdba3692b9a8936e62f2a43dbb403d5fe947632`，GitHub Actions run `40855054073` 成功；站点 HTTP 返回 200。后续新增交接记录的提交会自动触发下一次部署。
