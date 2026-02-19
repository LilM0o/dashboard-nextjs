# 🚀 OpenClaw Dashboard (Next.js)

Dashboard de monitoring temps réel pour OpenClaw, hébergé sur VPS.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: SWR pour polling (30s)
- **Deploy**: VPS (pas Vercel)

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

Le dashboard utilise les données du fichier `dashboard-data.json` dans le workspace.

## License

MIT
