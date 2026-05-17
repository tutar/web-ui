<!--
  Standalone web UI for the managed-agent platform.
  This app talks to managed-agent-api over HTTP/SSE and should not own
  backend runtime configuration such as model provider selection.
-->

# Web UI

`apps/web-ui` 是独立前端应用。

固定本地端口约定：
- `managed-agent-api`: `3000`
- `harness-worker`: `4000`
- `web-ui`: `4173`

默认 API 基址：
- `VITE_MANAGED_AGENT_API_BASE_URL=http://127.0.0.1:3000`

启动：

```bash
npm run start --workspace @managed-agent/web-ui
```

或在仓库根目录联调：

```bash
npm run dev:all
npm run dev:all:pi
```

如需覆盖 API 地址或用户 ID，可在本地环境中设置：
- `VITE_MANAGED_AGENT_API_BASE_URL`
- `VITE_MANAGED_AGENT_USER_ID`
