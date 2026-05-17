<!--
  Standalone web UI for the managed-agent platform.
  This app talks to managed-agent-api over HTTP/SSE and should not own
  backend runtime configuration such as model provider selection.
-->

# Web UI

`apps/web-ui` 是独立前端应用。

固定本地端口约定：
- `managed-agent-api`: `4173`
- `harness-worker`: `4000`
- `web-ui`: `3000`

默认 API 基址会按浏览器当前 hostname 自动推导：
- `http://localhost:3000` -> `http://localhost:4173`
- `http://127.0.0.1:3000` -> `http://127.0.0.1:4173`

如果手工配置 `VITE_MANAGED_AGENT_API_BASE_URL`，本地开发应保持与页面相同的 loopback hostname，避免混用 `localhost` 和 `127.0.0.1`，否则登录 cookie 不会跨站发送。

启动：

```bash
npm run start --workspace @managed-agent/web-ui
```

或在仓库根目录联调：

```bash
npm run dev:all
npm run dev:all:pi
```

如需覆盖 API 地址，可在本地环境中设置：
- `VITE_MANAGED_AGENT_API_BASE_URL`
