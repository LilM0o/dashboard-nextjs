# 🚀 OpenClaw Dashboard (Next.js)

Dashboard de monitoring temps réel pour OpenClaw, hébergé sur VPS.

## Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Data**: SWR pour polling (30s)
- **Deploy**: VPS OVH (port 5454)

## Installation

```bash
npm install
npm run dev
```

## Build Production

```bash
npm run build
npm start
```

## Configuration

Le dashboard récupère les données depuis :
- `openclaw sessions list --json` pour les sessions
- `/home/ubuntu/.openclaw/logs/commands.log` pour les messages

## Accès

- **Dashboard**: http://100.86.54.54:5454
- **Filebrowser**: http://100.86.54.54:8443
- **Mission Control**: http://100.86.54.54:3001

## APIs

| Route | Description |
|-------|-------------|
| `/api/agents` | Sessions, KPIs agents |
| `/api/quotas` | Quotas Z.AI + MiniMax |
| `/api/tokens` | Historique tokens 7j |
| `/api/messages` | Messages par jour |
| `/api/cron` | Status cron jobs |
| `/api/system` | Métriques système |

## License

MIT
