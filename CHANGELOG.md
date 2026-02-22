# Changelog

## [2.1.0] - 2026-02-22

### Corrections
- **Skills Chart** - Correction bug API (sessionsData vide → sessionsResults flatMap)
- **Models Chart** - Correction bug API (sessionsData vide → sessionsResults flatMap)
- **Quotas** - Ajout mapping modèles sans préfixe (glm-4.7, MiniMax-M2.5, etc.)
- **Cron Jobs** - Ajout accordéon (mode compact par défaut, clic pour déplier)
- **Doublon Ressources** - Suppression SystemMetrics (doublon de CpuRamChart)
- **Bouton Gateway** - Correction URL (http://100.86.54.54:18789 → /gateway)
- **Bouton Mission Control** - Correction port (3001 → 9595)
- **Heartbeats** - Ajout fallback basé sur HEARTBEAT.md

### Modifications
- Layout onglet Système: Suppression carte Système en haut à gauche
- UX Cron Jobs: Mode compact par défaut avec accordéon

### Détails Techniques
- API `/api/skills` - Fix sessionsData undefined
- API `/api/models-usage` - Fix sessionsData undefined
- API `/api/quotas` - Étendu MODEL_TO_PROVIDER
- API `/api/heartbeats` - Ajout fallback basé sur HEARTBEAT.md
- Composant `cron-jobs.tsx` - Ajout état expandedJob et accordéon
- Page `page.tsx` - Suppression SystemMetrics, correction boutons

---

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
