# GitHub Pages 部署交接

- 项目根目录：`/Users/xinwei/大健康代理商管理原型`
- GitHub 仓库：<https://github.com/xinwei5282-sys/big-health-agent-demo>
- GitHub Pages：<https://xinwei5282-sys.github.io/big-health-agent-demo/>
- 发布分支：`main`；`.github/workflows/pages.yml` 在推送和手动触发时构建并部署静态页面。
- 演示数据真源：`src/business-demo-data.ts`；最近生成的门店/集团经营诊断、团队分析和顾客方案快照：`src/ai-demo-snapshots.ts`。新访客以这些快照为默认展示，浏览器本地保存的更新优先。
- Pages 只托管静态文件。`server.mjs` 需要单独部署到支持 Node.js 的服务，并配置 `VITE_AI_API_URL`，否则线上“重新生成”及新 AI 分析不可用；API Key 不得放入前端或仓库。
- 最近页面版本部署：commit `3e940fbf6ae68385881704de665ca50c82b9a9d4`，GitHub Actions run `41009416000` 成功；Pages 首页与 JS bundle 均返回 HTTP 200，bundle 已核对本轮员工快照和新板块文本。后续新增交接记录的提交会自动触发下一次部署。
- 本轮 2026-10-30：工作台待办改成三条摘要及“查看全部”全量页；门店导航增加“市场”，只展示当前门店关联代理与其员工；新增门店团队分析及单员工 AI 经营详情；集团看板增加重点商品销售、库存预警、慢动销和排行。员工基础台账关联本店 POS 订单、顾客、回访和健康方案服务记录，数据版本 `store-demo-v7`；五位员工分析快照由百炼 qwen3.8-max 按 `app-prompts-v6:business:store-employee` 真实生成。`npm run check:runtime`、`npm run build`、`git diff --check` 均通过；本地 `4175` 返回 200 且实际模块含本轮功能和五条员工快照。自动化浏览器宿主不可用，本轮未完成截图级视觉及点击验收。提交推送后由 GitHub Actions 部署 Pages。
- 本轮后续修正：工作台固定只显示未完成待办，并使用独立的“待办”栏头；未完成/已完成筛选仅在“查看全部”页。此项修正后再次通过 runtime check、build、diff check；重启既有 `4175` 并确认服务输出新模块。浏览器宿主仍不可用，无法做截图级视觉验收。
- 本轮导航修正：门店和集团的“市场”导航改用独立店铺图标；顾客保留人群图标，两个图标均沿用同一图形的描边/填充选中状态。
