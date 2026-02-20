# Changelog

## [2.0.0] - 2026-02-19

### Ajoutées
- **Données réelles OpenClaw** - Plus de mock data
- **Graphique Messages/Jour** - Nouveau composant avec données depuis commands.log
- **Quotas API réels** - Calculs Z.AI + MiniMax avec coûts estimés
- **Tokens 7 jours** - Graphique journalier avec données réelles
- **Header date/heure** - Affichage date/heure réelle (format français)
- **Bouton Refresh global** - Synchronisation manuelle
- **Agent KPIs interactifs** - Graphiques bar chart + details

### Modifiées
- `page.tsx` - Header with date/heure + bouton Refresh
- `quotas-display.tsx` - Données réelles depuis API
- `tokens-chart.tsx` - Graphique journalier + formatter fix
- `sessions-list.tsx` - Données réelles OpenClaw
- `agents-kpis.tsx` - Graphiques + interactivité
- `cpu-ram-chart.tsx` - Support className prop
- `cron/route.ts` - Fix bug lastStatus unknown

### Techniques
- Fix imports duplicates (useState)
- Fix type errors (formatter recharts)
- Fix variable names (totalSessions)
- Build Next.js 16 + Turbopack

---

## [1.0.0] - 2026-01-?? (Initial)

- Version initiale avec mock data
- Dashboard basique avec tabs Système/AI
