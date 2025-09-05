# 🚀 Quick Start - CityGrid SaaS

## Installation rapide

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd citygrid-saas

# 2. Exécuter le script d'installation
./setup.sh

# 3. Lancer l'application
npm run dev
```

## 🔑 Variables d'environnement essentielles

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-key-min-32-chars
```

## 🗄️ Configuration Supabase

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Exécuter les migrations SQL** (dans l'ordre) :
   ```sql
   -- Copier-coller dans l'éditeur SQL Supabase
   sql-migrations/01_initial_schema.sql
   sql-migrations/02_rls_policies.sql
   sql-migrations/03_functions.sql
   sql-migrations/04_sample_data.sql  -- (optionnel, données de test)
   ```

3. **Configurer l'auth Supabase** :
   - Authentication > Settings > Auth
   - Activer "Enable email confirmations"
   - Site URL: `http://localhost:3000`

## 🧪 Test rapide

1. **Démarrer l'app** : `npm run dev`
2. **Créer un compte** : http://localhost:3000/register
3. **Vérifier l'email** (dans les logs Supabase ou votre client mail)
4. **Se connecter** : http://localhost:3000/login
5. **Accéder au dashboard** : http://localhost:3000/dashboard

## 📊 Fonctionnalités disponibles

### ✅ Implémenté
- 🔐 **Authentification multi-tenant** (JWT + Supabase)
- 🏢 **Gestion d'organisations** (RLS + isolation des données)
- 📋 **Dashboard** avec KPIs et graphiques
- 🏗️ **Référentiel** d'équipements (catégories, types, seuils)
- 📁 **Projets** avec géolocalisation
- 🧮 **Calculateur de conformité** 
- 🔒 **Sécurité RLS** complète
- 📖 **API REST** documentée (Swagger)

### 🔄 Endpoints API fonctionnels
- `GET /health` - Health check
- `GET /auth/profile` - Profil utilisateur
- `GET /org` - Organisation courante
- `GET /projects` - Liste des projets
- `GET /referentiel/categories` - Catégories d'équipements
- `GET /analytics/dashboard` - KPIs dashboard
- `POST /referentiel/checks/conformity` - Vérification conformité

## 🌐 URLs d'accès

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur |
| Backend | http://localhost:3001 | API REST |
| API Docs | http://localhost:3001/api/docs | Documentation Swagger |

## 🎯 Comptes de test

Après avoir exécuté `04_sample_data.sql` :

- **Organisation 1** : Ville de Lyon
- **Organisation 2** : Métropole de Marseille
- Projets d'exemple avec équipements géolocalisés

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev              # Lance frontend + backend
npm run dev:frontend     # Lance uniquement le frontend  
npm run dev:backend      # Lance uniquement le backend

# Build
npm run build           # Build frontend + backend
npm run build:frontend  # Build frontend uniquement
npm run build:backend   # Build backend uniquement

# Tests & Lint
npm run test            # Tests frontend + backend
npm run lint            # Lint frontend + backend
```

## 🚨 Problèmes courants

### Backend ne démarre pas
- Vérifier les variables d'environnement dans `backend/.env`
- S'assurer que Supabase est accessible
- Vérifier que les migrations SQL ont été exécutées

### Frontend erreur 401
- Vérifier que le backend tourne sur le port 3001
- Contrôler la configuration JWT_SECRET (même valeur frontend/backend)
- Vérifier les cookies dans les DevTools

### RLS Policies
- S'assurer que l'utilisateur a bien un `membership` dans une organisation
- Vérifier que les JWT contiennent les claims `org_id` et `role`

## 📚 Documentation complète

- **Architecture** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Déploiement** : [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) 
- **API** : http://localhost:3001/api/docs (Swagger)
- **SQL** : [sql-migrations/README.md](sql-migrations/README.md)

## 🤝 Support

Pour toute question :
1. Consulter la documentation dans `/docs`
2. Vérifier les issues GitHub
3. Examiner les logs backend/frontend

---

**🎉 Votre SaaS multi-tenant est prêt !** 

Commencez par créer votre première organisation et explorer les fonctionnalités.