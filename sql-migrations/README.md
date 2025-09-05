# Migrations SQL Supabase

Ce dossier contient les scripts SQL pour initialiser la base de données Supabase.

## Ordre d'exécution

1. **01_initial_schema.sql** - Schéma initial avec toutes les tables
2. **02_rls_policies.sql** - Politiques RLS pour la sécurité multi-tenant
3. **03_functions.sql** - Fonctions PostgreSQL pour les calculs et analytics
4. **04_sample_data.sql** - Données d'exemple (développement uniquement)

## Instructions d'installation

### Via l'interface Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans l'onglet "SQL Editor"
3. Exécutez chaque script dans l'ordre

### Via CLI Supabase

```bash
supabase db reset
supabase db push
```

## Structure des données

### Multi-tenancy

Le système utilise `org_id` pour isoler les données :
- Chaque organisation a ses propres données
- RLS appliqué sur toutes les tables
- JWT contient `org_id` et `role` pour l'autorisation

### Tables principales

- **org** - Organisations/tenants
- **user_profile** - Profils utilisateur (étend auth.users)
- **membership** - Association user ↔ org avec rôles
- **equipment_category** - Catégories d'équipements
- **equipment_type** - Types d'équipements
- **project** - Projets d'aménagement
- **equipment_instance** - Instances d'équipements dans les projets

### Sécurité RLS

Exemples de politiques implémentées :

```sql
-- Les utilisateurs ne voient que les données de leur org
CREATE POLICY "Users can view projects in their org" ON project
  FOR SELECT USING (org_id = auth.jwt_org_id());

-- Seuls les membres peuvent modifier
CREATE POLICY "Organization members can manage projects" ON project
  FOR ALL USING (
    org_id = auth.jwt_org_id() AND 
    auth.jwt_user_role() IN ('owner', 'admin', 'member')
  );
```

### Fonctions utilitaires

- `check_project_conformity()` - Vérifie la conformité d'un projet
- `get_coverage_analytics()` - Calcule les statistiques de couverture
- `create_audit_log()` - Créé des logs d'audit
- `get_org_statistics()` - Statistiques globales de l'organisation

## Extensions requises

- `uuid-ossp` - Génération d'UUID
- `postgis` - Données géospatiales pour les locations

## Types personnalisés

```sql
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
```

## Index de performance

Index créés pour optimiser les requêtes :
- Index sur les clés étrangères
- Index spatiaux GIST pour les colonnes GEOMETRY
- Index composites pour les requêtes fréquentes

## Données d'exemple

Le script `04_sample_data.sql` contient :
- 2 organisations (Lyon, Marseille)
- Catégories et types d'équipements
- Projets avec coordonnées GPS
- Équipements géolocalisés

**⚠️ À ne pas exécuter en production !**