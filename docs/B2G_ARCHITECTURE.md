# Architecture B2G - Business to Government

## Vue d'ensemble

Transformation du SaaS multi-tenant existant vers un modèle B2G où :
- Chaque **État** devient un tenant principal
- Chaque État peut configurer sa propre **arborescence administrative** (régions, départements, communes, etc.)
- Hiérarchie flexible et configurable selon les structures gouvernementales de chaque pays/état

## Architecture hiérarchique

```
État (Tenant principal)
├── Région 1
│   ├── Département A
│   │   ├── Commune 1
│   │   ├── Commune 2
│   │   └── Commune 3
│   └── Département B
│       ├── Commune 4
│       └── Commune 5
└── Région 2
    └── Département C
        ├── Commune 6
        └── Commune 7
```

## Modèle de données

### 1. Structure administrative
```sql
-- Table principale pour les nœuds de l'arborescence administrative
CREATE TABLE administrative_node (
  id UUID PRIMARY KEY,
  state_id UUID REFERENCES org(id), -- État (tenant principal)
  parent_id UUID REFERENCES administrative_node(id), -- Nœud parent
  name VARCHAR(255) NOT NULL,
  level_type VARCHAR(50) NOT NULL, -- 'region', 'department', 'commune', etc.
  level_order INTEGER NOT NULL, -- Ordre hiérarchique (1=région, 2=département, etc.)
  code VARCHAR(20), -- Code administratif officiel
  population INTEGER,
  area_sqm DECIMAL,
  location GEOMETRY(Polygon, 4326), -- Frontières géographiques
  metadata JSONB, -- Données spécifiques selon le type de niveau
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration des niveaux administratifs par État
CREATE TABLE administrative_level (
  id UUID PRIMARY KEY,
  state_id UUID REFERENCES org(id),
  name VARCHAR(100) NOT NULL, -- 'Région', 'Département', 'Commune'
  code VARCHAR(20) NOT NULL, -- 'region', 'department', 'commune'
  level_order INTEGER NOT NULL, -- 1, 2, 3, etc.
  color VARCHAR(7), -- Couleur pour la visualisation
  icon VARCHAR(50), -- Icône
  requires_parent BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Permissions et accès
```sql
-- Permissions par niveau administratif
CREATE TABLE administrative_permission (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id),
  node_id UUID REFERENCES administrative_node(id),
  permission_level VARCHAR(50) NOT NULL, -- 'read', 'write', 'admin'
  inherited BOOLEAN DEFAULT false, -- Permission héritée du parent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gestion des utilisateurs par niveau administratif
CREATE TABLE administrative_user (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id),
  node_id UUID REFERENCES administrative_node(id),
  role VARCHAR(50) NOT NULL, -- 'manager', 'technician', 'viewer'
  scope VARCHAR(50) DEFAULT 'node', -- 'node', 'subtree'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Adaptation des tables existantes
```sql
-- Ajout de la référence au nœud administratif dans les projets
ALTER TABLE project ADD COLUMN administrative_node_id UUID REFERENCES administrative_node(id);
ALTER TABLE equipment_instance ADD COLUMN administrative_node_id UUID REFERENCES administrative_node(id);

-- Index pour les requêtes hiérarchiques
CREATE INDEX idx_administrative_node_state ON administrative_node(state_id);
CREATE INDEX idx_administrative_node_parent ON administrative_node(parent_id);
CREATE INDEX idx_administrative_node_level ON administrative_node(level_type, level_order);
CREATE INDEX idx_administrative_permission_node ON administrative_permission(node_id);
```

## API Endpoints

### Gestion de l'arborescence administrative

```typescript
// GET /api/states/{stateId}/administrative-tree
// Récupère l'arborescence complète d'un État

// POST /api/states/{stateId}/administrative-levels
// Configure les niveaux administratifs d'un État

// POST /api/states/{stateId}/administrative-nodes
// Crée un nouveau nœud administratif

// GET /api/administrative-nodes/{nodeId}/children
// Récupère les enfants d'un nœud

// GET /api/administrative-nodes/{nodeId}/projects
// Récupère les projets d'un nœud (avec héritage des enfants)
```

### Gestion des permissions

```typescript
// POST /api/administrative-nodes/{nodeId}/users
// Assigne un utilisateur à un nœud administratif

// GET /api/users/{userId}/administrative-access
// Récupère les accès administratifs d'un utilisateur

// POST /api/administrative-nodes/{nodeId}/permissions
// Définit des permissions spécifiques sur un nœud
```

## Frontend - Interface de configuration

### 1. Page de configuration de l'arborescence
- **TreeView interactive** pour visualiser et modifier l'arborescence
- **Drag & drop** pour réorganiser les nœuds
- **Formulaires contextuels** pour éditer chaque nœud

### 2. Sélecteur de contexte administratif
- **Breadcrumb** affichant la hiérarchie actuelle
- **Dropdown hiérarchique** pour naviguer dans l'arborescence
- **Filtres automatiques** basés sur le contexte sélectionné

### 3. Tableau de bord multi-niveaux
- **Métriques agrégées** par niveau administratif
- **Comparaisons** entre régions/départements/communes
- **Cartes choroplèthes** colorées par niveau

## Cas d'usage B2G

### État français
```
France (État)
├── Île-de-France (Région)
│   ├── Paris (Département 75)
│   │   ├── Paris 1er (Arrondissement)
│   │   └── Paris 2ème (Arrondissement)
│   └── Hauts-de-Seine (Département 92)
│       ├── Boulogne-Billancourt (Commune)
│       └── Neuilly-sur-Seine (Commune)
└── Provence-Alpes-Côte d'Azur (Région)
    └── Bouches-du-Rhône (Département 13)
        ├── Marseille (Commune)
        └── Aix-en-Provence (Commune)
```

### État fédéral (USA, Allemagne, etc.)
```
Texas (État)
├── Harris County (Comté)
│   ├── Houston (Ville)
│   └── Pasadena (Ville)
└── Dallas County (Comté)
    ├── Dallas (Ville)
    └── Irving (Ville)
```

## Sécurité et isolation

### 1. Row Level Security (RLS)
- **Isolation par État** : chaque tenant ne peut voir que ses données
- **Permissions héritées** : accès automatique aux nœuds enfants
- **Politiques contextuelles** basées sur le nœud administratif

### 2. JWT Claims enrichis
```typescript
interface B2GJwtPayload {
  sub: string; // user_id
  state_id: string; // org_id (tenant principal)
  administrative_nodes: string[]; // nœuds auxquels l'utilisateur a accès
  permissions: {
    node_id: string;
    level: 'read' | 'write' | 'admin';
    inherited: boolean;
  }[];
}
```

## Migration depuis l'existant

### 1. Transformation des organisations
- Chaque `org` existante devient un **État** (tenant principal)
- Les projets existants sont rattachés au nœud racine de l'État

### 2. Configuration initiale
- Chaque État doit configurer ses **niveaux administratifs**
- Import des **découpages territoriaux** depuis des sources officielles
- **Migration assistée** avec templates prédéfinis par pays

### 3. Interface de migration
- **Assistant de configuration** pour les nouveaux États
- **Templates** pour les structures administratives communes
- **Import CSV/GeoJSON** pour les données géographiques

## Avantages du modèle B2G

1. **Scalabilité gouvernementale** : chaque État gère sa propre structure
2. **Conformité réglementaire** : respect des découpages administratifs officiels
3. **Permissions granulaires** : contrôle précis par niveau administratif
4. **Reporting hiérarchique** : agrégation automatique des métriques
5. **Isolation complète** : sécurité renforcée entre États

## Prochaines étapes

1. ✅ Conception de l'architecture
2. ⏳ Implémentation du modèle de données
3. ⏳ Développement de l'API administrative
4. ⏳ Interface de configuration frontend
5. ⏳ Migration des données existantes