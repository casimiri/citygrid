# Guide de Migration vers le Modèle B2G

## Vue d'ensemble

Ce guide vous accompagne dans la transformation de votre SaaS multi-tenant existant vers un modèle B2G (Business-to-Government) avec arborescence administrative configurable.

## Prérequis

1. **Base de données Supabase** configurée et accessible
2. **Backend NestJS** fonctionnel
3. **Frontend Next.js** opérationnel
4. **Accès administrateur** à la base de données

## Étapes de Migration

### 1. Migration de la Base de Données

#### A. Exécuter les nouvelles migrations

```bash
# Connectez-vous à votre base Supabase
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/postgres"

# Exécutez la migration B2G
\i sql-migrations/05_b2g_administrative_structure.sql
```

#### B. Vérifier l'intégrité des données

```sql
-- Vérifier les nouvelles tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('administrative_level', 'administrative_node', 'administrative_permission', 'administrative_user');

-- Vérifier les fonctions créées
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%administrative%';
```

### 2. Configuration des États

#### A. Marquer les organisations existantes comme États

```sql
-- Exemple: Transformer une organisation en État français
UPDATE org 
SET 
  is_state = true,
  country_code = 'FRA',
  state_code = 'FR',
  administrative_system = 'french'
WHERE slug = 'votre-organisation';
```

#### B. Créer la structure administrative de base

Pour un État français type :

```sql
-- 1. Créer les niveaux administratifs
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon) VALUES
((SELECT id FROM org WHERE slug = 'votre-organisation'), 'Région', 'region', 1, '#ef4444', 'map'),
((SELECT id FROM org WHERE slug = 'votre-organisation'), 'Département', 'department', 2, '#f59e0b', 'map-pin'),
((SELECT id FROM org WHERE slug = 'votre-organisation'), 'Commune', 'commune', 3, '#10b981', 'home');

-- 2. Créer quelques nœuds administratifs exemple
-- (Adaptez selon votre structure administrative)
WITH state AS (SELECT id FROM org WHERE slug = 'votre-organisation'),
     region_level AS (SELECT id FROM administrative_level WHERE state_id = (SELECT id FROM state) AND code = 'region')
INSERT INTO administrative_node (state_id, level_id, name, code, population, area_sqm)
SELECT 
  state.id,
  region_level.id,
  'Île-de-France',
  '11',
  12278210,
  12012000000
FROM state, region_level;
```

### 3. Migration des Projets Existants

#### A. Associer les projets aux nœuds administratifs

```sql
-- Créer un nœud "racine" temporaire pour les projets existants
WITH state AS (SELECT id FROM org WHERE slug = 'votre-organisation'),
     commune_level AS (SELECT id FROM administrative_level WHERE state_id = (SELECT id FROM state) AND code = 'commune')
INSERT INTO administrative_node (state_id, level_id, name, code, description)
SELECT 
  state.id,
  commune_level.id,
  'Zone Non Assignée',
  'ZNA',
  'Nœud temporaire pour les projets existants en attente d''affectation'
FROM state, commune_level;

-- Associer tous les projets existants au nœud temporaire
UPDATE project 
SET administrative_node_id = (
  SELECT an.id 
  FROM administrative_node an 
  JOIN org o ON an.state_id = o.id 
  WHERE o.slug = 'votre-organisation' AND an.code = 'ZNA'
)
WHERE org_id = (SELECT id FROM org WHERE slug = 'votre-organisation')
AND administrative_node_id IS NULL;
```

### 4. Configuration du Backend

#### A. Redémarrer les services

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Vérifier que le nouveau module est chargé
curl -X GET http://localhost:3001/api/v1/administrative/states/[STATE-ID]/levels \
  -H "Authorization: Bearer [YOUR-JWT-TOKEN]"
```

### 5. Configuration du Frontend

#### A. Tester la nouvelle interface d'administration

1. Connectez-vous à votre application
2. Naviguez vers `/dashboard/administration`
3. Vérifiez que l'arborescence s'affiche correctement
4. Testez la création de nouveaux niveaux et nœuds

### 6. Configuration des Permissions

#### A. Assigner les utilisateurs existants aux nœuds administratifs

```sql
-- Exemple: Donner accès admin au nœud racine pour les propriétaires d'organisation
INSERT INTO administrative_user (user_id, node_id, role, scope, appointed_by)
SELECT 
  m.user_id,
  an.id,
  'admin',
  'subtree',
  m.user_id
FROM membership m
JOIN org o ON m.org_id = o.id
JOIN administrative_node an ON an.state_id = o.id
WHERE o.slug = 'votre-organisation' 
  AND m.role = 'owner'
  AND an.parent_id IS NULL; -- Nœud racine
```

## Templates par Pays

### France
```sql
-- Niveaux administratifs français standard
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon, requires_parent) VALUES
('[STATE-ID]', 'Région', 'region', 1, '#ef4444', 'map', false),
('[STATE-ID]', 'Département', 'department', 2, '#f59e0b', 'map-pin', true),
('[STATE-ID]', 'Arrondissement', 'arrondissement', 3, '#8b5cf6', 'map-pin', true),
('[STATE-ID]', 'Commune', 'commune', 4, '#10b981', 'home', true);
```

### États-Unis
```sql
-- Niveaux administratifs US standard
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon, requires_parent) VALUES
('[STATE-ID]', 'State', 'state', 1, '#ef4444', 'map', false),
('[STATE-ID]', 'County', 'county', 2, '#f59e0b', 'map-pin', true),
('[STATE-ID]', 'City', 'city', 3, '#10b981', 'home', true);
```

### Allemagne
```sql
-- Niveaux administratifs allemands standard
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon, requires_parent) VALUES
('[STATE-ID]', 'Bundesland', 'bundesland', 1, '#ef4444', 'map', false),
('[STATE-ID]', 'Regierungsbezirk', 'regierungsbezirk', 2, '#f59e0b', 'map-pin', true),
('[STATE-ID]', 'Landkreis', 'landkreis', 3, '#8b5cf6', 'map-pin', true),
('[STATE-ID]', 'Gemeinde', 'gemeinde', 4, '#10b981', 'home', true);
```

## Validation Post-Migration

### 1. Tests de Base de Données

```sql
-- Vérifier l'intégrité des références
SELECT 
  'administrative_node' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT state_id) as unique_states
FROM administrative_node
UNION ALL
SELECT 
  'administrative_level' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT state_id) as unique_states
FROM administrative_level;

-- Vérifier les contraintes hiérarchiques
SELECT 
  an.name,
  al.name as level_name,
  al.level_order,
  parent.name as parent_name,
  parent_level.level_order as parent_level_order
FROM administrative_node an
JOIN administrative_level al ON an.level_id = al.id
LEFT JOIN administrative_node parent ON an.parent_id = parent.id
LEFT JOIN administrative_level parent_level ON parent.level_id = parent_level.id
WHERE an.parent_id IS NOT NULL 
  AND parent_level.level_order >= al.level_order; -- Doit être vide
```

### 2. Tests API

```bash
# Test des endpoints administratifs
curl -X GET "http://localhost:3001/api/v1/administrative/states/[STATE-ID]/tree" \
  -H "Authorization: Bearer [JWT-TOKEN]"

curl -X GET "http://localhost:3001/api/v1/administrative/states/[STATE-ID]/levels" \
  -H "Authorization: Bearer [JWT-TOKEN]"
```

### 3. Tests Frontend

1. **Navigation** : Vérifier que le menu "Administration" est accessible
2. **Arborescence** : S'assurer que l'arbre s'affiche correctement
3. **CRUD** : Tester création, modification, suppression des nœuds
4. **Permissions** : Vérifier l'isolation des données par État

## Troubleshooting

### Erreurs Communes

#### 1. "Constraint violation" lors de création de nœud
```sql
-- Vérifier la hiérarchie des niveaux
SELECT al.name, al.level_order, al.requires_parent
FROM administrative_level al 
WHERE al.state_id = '[STATE-ID]'
ORDER BY al.level_order;
```

#### 2. "État non trouvé" dans l'API
```sql
-- Vérifier que l'organisation est marquée comme État
SELECT id, name, is_state, country_code, administrative_system 
FROM org 
WHERE id = '[STATE-ID]';
```

#### 3. Interface d'administration vide
- Vérifier les tokens JWT
- Contrôler les permissions org_id
- Examiner les logs du backend

### Rollback d'Urgence

Si nécessaire, pour revenir à l'état précédent :

```sql
-- Supprimer les nouvelles colonnes (ATTENTION: perte de données)
ALTER TABLE project DROP COLUMN administrative_node_id;
ALTER TABLE equipment_instance DROP COLUMN administrative_node_id;
ALTER TABLE org DROP COLUMN is_state;
ALTER TABLE org DROP COLUMN country_code;
ALTER TABLE org DROP COLUMN state_code;
ALTER TABLE org DROP COLUMN administrative_system;

-- Supprimer les nouvelles tables
DROP TABLE IF EXISTS administrative_user;
DROP TABLE IF EXISTS administrative_permission;
DROP TABLE IF EXISTS administrative_node;
DROP TABLE IF EXISTS administrative_level;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_administrative_hierarchy(UUID);
DROP FUNCTION IF EXISTS get_administrative_subtree(UUID);
DROP FUNCTION IF EXISTS calculate_inherited_permissions(UUID, UUID);
DROP FUNCTION IF EXISTS validate_administrative_hierarchy();
```

## Support et Maintenance

### Monitoring

- **Métriques de performance** : Surveiller les requêtes récursives
- **Intégrité des données** : Vérifications périodiques de la hiérarchie
- **Utilisation** : Analytics sur les nœuds les plus actifs

### Évolutions Futures

1. **Import géographique** : Support GeoJSON/Shapefile
2. **API géospatiale** : Requêtes par zone géographique
3. **Workflows d'approbation** : Validation hiérarchique des projets
4. **Reporting multi-niveaux** : Agrégation automatique des KPIs

---

**✅ Migration B2G complétée avec succès !**

Votre SaaS est maintenant configuré pour servir des clients gouvernementaux avec des structures administratives flexibles et configurables.