# CityGrid - SaaS Multi-Tenant

SaaS multi-tenant pour la gestion et la conformité d'équipements urbains.

## Stack Technique

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + Prisma
- **Database**: Supabase (PostgreSQL + RLS + PostGIS)
- **Auth**: JWT multi-tenant via Supabase Auth
- **Payments**: Stripe
- **Hosting**: Vercel

## Architecture

```
citygrid-saas/
├── frontend/          # Next.js application
├── backend/           # NestJS API
├── sql-migrations/    # Scripts SQL Supabase
└── docs/             # Documentation
```

## Installation

1. **Cloner le projet et installer les dépendances**:
```bash
git clone <repo-url>
cd citygrid-saas
npm run install:all
```

2. **Configuration des variables d'environnement**:
   - Copier `.env.example` vers `.env.local` dans frontend/
   - Copier `.env.example` vers `.env` dans backend/
   - Renseigner les clés Supabase, Stripe, etc.

3. **Initialiser la base de données**:
```bash
# Exécuter les migrations SQL dans Supabase
# Voir sql-migrations/README.md
```

4. **Lancer en développement**:
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## Scripts disponibles

- `npm run dev` - Lance frontend + backend en parallèle
- `npm run build` - Build les deux projets
- `npm run test` - Lance tous les tests
- `npm run lint` - Lint les deux projets

## Multi-tenancy

Le système utilise `org_id` dans les JWT claims pour isoler les données:
- Chaque requête API vérifie l'organisation
- RLS activé côté Supabase
- Isolation complète des données par organisation

## Modules MVP

1. **Référentiel**: Catégories, types d'équipements, seuils
2. **Projets**: Gestion des projets et équipements
3. **Conformité**: Calculateur de conformité réglementaire
4. **Analytics**: Tableaux de bord et reporting
5. **Stripe**: Gestion des abonnements multi-orgs