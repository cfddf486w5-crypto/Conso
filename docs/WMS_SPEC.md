# 🛠️ Spécifications Techniques — WMS HTML Web (Mobile-First)

## 1. Contexte & objectifs

### Objectif
Décrire l’architecture complète, les composants techniques, les flux de données, les règles de gestion, les API et les tests pour une application **Warehouse Management System (WMS)** mobile-first en HTML/JS, avec import CSV, cache offline et export PDF/Excel.

### Indice fonctionnel du WMS
Un WMS est un système logiciel destiné à optimiser et automatiser les opérations d’entrepôt : stock, racks, emplacements, bins, scanning, remises, consolidation, transferts et suivi palette.

---

## 2. Architecture système

### Architecture générale
- **Frontend** : HTML5, CSS, JavaScript Vanilla (ES6+)
- **Support offline** : LocalStorage (IndexedDB si structuration complexe)
- **Import/Export** : CSV (Latin-1), PDF et Excel
- **Scan** : caméra mobile (`getUserMedia`) + support scanners clavier
- **Déploiement** : hébergement statique (GitHub Pages, Netlify, S3)

### Vue d’architecture (C4 haut niveau)
1. **Contexte système** : application WMS unique, managers terrain, devices mobiles
2. **Containers** :
   - UI HTML
   - Business Logic JS
   - Data Layer (LocalStorage)
   - Module Import/Export
3. **Composants** :
   - Scan Processor
   - Inventory Analyzer
   - Remise Engine
   - Consolidation Engine
   - Palette Engine
   - Transfert Engine
   - Settings & Rules
4. **Déploiement** : front stateless + sync offline via imports/exports CSV

> Référence structurante : C4 (System Context → Containers → Components → Deployment)

---

## 3. Composants

### 3.1 Scan Processor

**Fonctions**
- Détection de type : `ITEM` / `BIN`
- Normalisation des scans
- Appel des modules métiers associés

**Entrées / sorties**
- Entrée : code scanné
- Sortie : objet `{ type, payload, timestamp }`

**Règles**
- Scan `ITEM` → lookup inventaire
- Scan `BIN` → lookup contenu bin

### 3.2 Inventory Analyzer

**Fonctions**
- Mapping des données CSV importées en objets internes
- Calcul des quantités totales par SKU et par emplacement
- Génération de tables de référence internes

**Règles**
- Consolidation automatique des doublons SKU
- Détection et signalement des bins vides

### 3.3 Workflow Engines

#### Remise Engine
- Construction dynamique de la liste
- Logique de confirmation (`qty` + `bin`)
- Workflow optimisé par zones (« tour du monde »)

#### Consolidation Engine
- Algorithme de proposition de déplacements
- Analyse de capacité bin, priorités, règles P1–P7
- Génération automatisée de tâches

#### Palette Engine
- Création `PALID`, regroupement de commandes
- Génération PDF avec Code128
- Historique journalier

#### Transfert Engine
- Gestion des déplacements internes stock → stock
- Journalisation des transactions

---

## 4. Modèle de données

### Entités principales (JSON)

```json
{
  "SKU": {
    "id": "string",
    "description": "string",
    "totalQty": "number",
    "locations": [{ "bin": "string", "qty": "number" }]
  },
  "Bin": {
    "id": "string",
    "currentSKUs": [{ "skuId": "string", "qty": "number" }],
    "capacity": "number"
  },
  "RemiseTask": {
    "id": "string",
    "items": [{ "skuId": "string", "bin": "string", "qty": "number" }],
    "status": "pending|done"
  }
}
```

---

## 5. Règles métiers (Business Rules)

1. Priorités zones : configurables via Settings
2. Capacité bins : capacité maximale paramétrable
3. Bins vides : traitement spécial + suggestions automatiques
4. Workflow scan : `ITEM → qty → BIN → confirmation`
5. Formats d’export : PDF/Excel standardisés

---

## 6. Technologies & dépendances

### Technologies
- HTML5, CSS3
- JavaScript Vanilla (ES6+)
- IndexedDB / LocalStorage
- `getUserMedia` (caméra)
- `jsPDF` (export PDF)
- `SheetJS` (export Excel)

---

## 7. API & interfaces

### API internes orientées JSON

Toutes les interactions métiers sont exposées via des fonctions de modules JS :

```js
scanInput(code);
analyzeInventory(csvFile);
generateRemiseTasks(data);
generateConsolidationTasks(data);
exportToPDF(data);
exportToExcel(data);
```

Chaque fonction doit retourner un objet JSON standardisé.

---

## 8. Tests unitaires & QA

### Tests recommandés
- Scan Processor (`ITEM` / `BIN` / invalid)
- Inventory Analyzer (champs manquants, doublons)
- Validation des suggestions de consolidation
- Workflows de complétion de tâches
- Modules d’export PDF/Excel

### Outils de test
- Jest / Vitest (unit tests)
- Cypress (E2E)
- Couverture cible : **≥ 90%**

---

## 9. Exemples de workflows

### Scan Workflow
`scanInput(code) → detectType → fetchInventory → UI update`

### Import CSV
`parse CSV → InventoryAnalyzer → push to LocalStorage → UI display`

---

## 10. Livrables

1. Code source complet
2. Documentation technique (README / ARCHITECTURE)
3. Tests automatisés
4. Scripts d’export PDF/Excel
5. Scénarios QA détaillés
6. Training manual

---

## 11. Roadmap de développement

- **Sprint 1** : architecture core + scan module
- **Sprint 2** : inventory + import/export
- **Sprint 3** : workflows remise + palette
- **Sprint 4** : consolidation engine
- **Sprint 5** : tests + QA + optimisations
