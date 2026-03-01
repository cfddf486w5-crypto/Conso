# Conso WMS Pro

Application WMS web mobile-first, offline-ready, construite en HTML/CSS/JavaScript vanilla.

## Fonctionnalités incluses
- Import CSV inventaire (`sku,description,bin,qty,capacity`).
- Détection scan `ITEM-` / `BIN-`.
- Génération de tâches de remise.
- Suggestions de consolidation des SKUs fragmentés.
- Création de palettes.
- Transferts internes entre bins.
- Sauvegarde locale (localStorage).
- Zone IA dédiée avec endpoint Azure AI Foundry préconfiguré:
  - `https://alexdam28-2806-resource.services.ai.azure.com/api/projects/alexdam28-2806`

## Démarrage rapide
```bash
npm test
npm run serve
```
Puis ouvrir `http://localhost:4173`.

## Exemple CSV
```csv
sku,description,bin,qty,capacity
SKU001,Produit 1,A01,10,100
SKU001,Produit 1,A02,5,100
SKU002,Produit 2,B01,7,120
```

## Notes IA
La zone IA sauvegarde localement endpoint, clé API et prompt opérateur. Le test de connexion exécute un `GET` direct sur l'endpoint configuré.
