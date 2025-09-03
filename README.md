# Initialisation d’un SaaS multi-tenant (Next.js + NestJS + Supabase + Stripe)

Tu es un **assistant développeur expert en SaaS multi-tenant**.  
Initialise un projet complet avec la stack suivante :  

- **Frontend** : Next.js (App Router) + Tailwind CSS + shadcn/ui  
- **Backend** : NestJS (API REST)  
- **Base de données** : Supabase (Postgres + RLS + PostGIS)  
- **Hébergement** : Vercel (frontend + API)  
- **Authentification** : JWT multi-tenant (claims `org_id` et `role`) via Supabase Auth  
- **Paiements** : Stripe (abonnements multi-orgs)  

---

## 🎯 Exigences techniques

### 1. Organisation multi-tenant
- Table `org` (UUID, name, slug, subscription_status)  
- Table `membership` (user_id, org_id, role)  
- Chaque requête API doit vérifier `org_id` du JWT.  
- RLS activé côté Supabase avec politiques SQL basées sur `org_id`.  

### 2. Modules minimum (MVP)
- **Référentiel** : `equipment_category`, `equipment_type`, `threshold`, `area_requirement`.  
- **Projets** : `project`, `equipment_instance`, `attachment`.  
- **Calculateur de conformité** : endpoint `POST /checks/conformity` → vérifie si un projet respecte les critères (population/distance/superficie).  
- **Tableaux de bord (Reporting)** : endpoint `GET /analytics/coverage` → retourne couverture vs requis.  

### 3. Frontend (Next.js)
- Pages :  
  - `/login`, `/register` (Supabase Auth)  
  - `/dashboard` (KPIs + charts)  
  - `/referentiel` (liste + fiche équipement)  
  - `/projets` (listing + détail)  
  - `/outils/calculateur` (formulaire → appel API conformité)  
- UI : Tailwind + shadcn/ui (cards, charts, table, modal).  

### 4. Backend (NestJS)
- Modules : `auth`, `org`, `projects`, `referentiel`, `analytics`, `stripe`.  
- Guards : `JwtAuthGuard`, `OrgGuard`.  
- Stripe webhook : `/webhooks/stripe` → maj `org.subscription_status`.  

### 5. Sécurité
- JWT signé avec secret partagé.  
- Middleware Next.js (Edge) pour résoudre `org_id` (sous-domaine ou cookie).  
- Audit log : table `audit_log (org_id, user_id, action, entity, before, after, created_at)`.  

### 6. DevOps
- Config `.env.local` avec clés Supabase + Stripe.  
- Scripts npm pour lancer frontend et backend (`pnpm dev:frontend`, `pnpm dev:backend`).  
- CI/CD : tests unitaires + migrations SQL.  

---

## 📦 Livraison attendue
- Arborescence du projet :  
  - `/frontend` avec Next.js  
  - `/backend` avec NestJS  
- Scripts init SQL pour Supabase (tables + RLS).  
- Exemple de policies RLS (`project`, `equipment_instance`).  
- Exemple de requête API (NestJS) avec validation JWT multi-tenant.  
- Un écran Dashboard Next.js affichant :  
  - 4 KPI cards (Nb projets, Couverture %, Défauts, Abonnés actifs)  
  - 1 graphique en barres (couverture par type équipement)  
  - 1 carte interactive (MapLibre avec points équipements)  

---

⚡ Agis comme un **starter-kit generator** :  
Fournis le code de base, fichiers `package.json`, `tsconfig.json`, config Tailwind, et les scripts SQL.
