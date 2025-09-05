# Guide de déploiement CityGrid

## 🚀 Déploiement sur Vercel

### Prérequis

1. **Compte Vercel** avec CLI installée
2. **Projet Supabase** configuré
3. **Compte Stripe** pour les paiements

### Variables d'environnement

#### Frontend (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app/api/v1
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Backend (Vercel Functions)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### Commandes de déploiement

```bash
# 1. Déployer le frontend
cd frontend
vercel --prod

# 2. Déployer le backend
cd ../backend
vercel --prod

# 3. Configurer les domaines personnalisés (optionnel)
vercel domains add your-domain.com
```

## 🗄️ Configuration Supabase

### 1. Créer le projet

1. Créer un nouveau projet sur [supabase.com](https://supabase.com)
2. Noter l'URL et les clés API
3. Configurer l'authentification par email

### 2. Exécuter les migrations

```sql
-- Exécuter dans l'ordre dans l'éditeur SQL Supabase :
-- 1. sql-migrations/01_initial_schema.sql
-- 2. sql-migrations/02_rls_policies.sql  
-- 3. sql-migrations/03_functions.sql
-- 4. sql-migrations/04_sample_data.sql (dev uniquement)
```

### 3. Configuration auth Supabase

```sql
-- Configurer les paramètres auth
UPDATE auth.config SET 
  email_confirm_timeout = 86400,
  password_min_length = 6;

-- Ajouter redirect URLs
INSERT INTO auth.redirect_urls (url) VALUES 
('https://your-app.vercel.app/auth/callback'),
('http://localhost:3000/auth/callback');
```

## 💳 Configuration Stripe

### 1. Webhook endpoints

Ajouter dans le dashboard Stripe :

- **URL** : `https://your-api-domain.vercel.app/api/v1/webhooks/stripe`
- **Events** : `customer.subscription.*`, `invoice.payment_*`

### 2. Produits et prix

Créer dans Stripe :

1. **Produit** : "CityGrid Pro"
   - Prix mensuel : 99€/mois
   - Prix annuel : 990€/an (2 mois offerts)

2. **Metadata à ajouter** :
   - `features`: `unlimited_projects,advanced_analytics,priority_support`

## 🔧 Configuration DNS

Si vous utilisez un domaine personnalisé :

```
# Records DNS à configurer
CNAME   app     your-frontend.vercel.app
CNAME   api     your-backend.vercel.app
```

## 📊 Monitoring

### Vercel Analytics

```javascript
// Ajouter dans next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/analytics'],
  },
}
```

### Supabase Edge Functions (optionnel)

```sql
-- Fonction pour nettoyer les logs d'audit
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Programmer l'exécution (via pg_cron si disponible)
SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_audit_logs();');
```

## 🚨 Sécurité

### Headers de sécurité

```javascript
// next.config.js
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { 
          key: 'Content-Security-Policy', 
          value: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';" 
        },
      ],
    },
  ],
}
```

### Rate limiting

```javascript
// middleware.ts - Ajouter rate limiting
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

## 🔍 Tests en production

### Health checks

```bash
# Test API health
curl https://your-api-domain.vercel.app/api/v1/health

# Test authentification
curl -X POST https://your-api-domain.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Tests utilisateur

1. **Inscription** : Créer un nouveau compte
2. **Organisation** : Créer une organisation
3. **Projets** : Créer et consulter des projets
4. **Dashboard** : Vérifier les KPIs
5. **Stripe** : Tester un abonnement (mode test)

## 📋 Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase exécutées
- [ ] RLS policies activées
- [ ] Webhook Stripe configuré
- [ ] Domaines DNS pointés
- [ ] SSL/TLS actifs
- [ ] Headers de sécurité configurés
- [ ] Tests de fonctionnement réalisés
- [ ] Monitoring activé
- [ ] Backup automatique activé (Supabase)

## 🆘 Rollback

En cas de problème :

```bash
# Rollback frontend
vercel rollback your-deployment-url

# Rollback backend  
vercel rollback your-api-deployment-url

# Rollback base de données (depuis Supabase dashboard)
# Aller dans Settings > Database > Point-in-time recovery
```