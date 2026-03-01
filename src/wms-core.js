const STORAGE_KEY = 'conso-wms-state-v1';

const defaultState = {
  inventory: {},
  bins: {},
  remises: [],
  palettes: [],
  transfers: [],
  settings: {
    zonePriority: ['A', 'B', 'C'],
    maxBinCapacity: 200,
  },
  ai: {
    endpoint: 'https://alexdam28-2806-resource.services.ai.azure.com/api/projects/alexdam28-2806',
    apiKey: '',
  },
};

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function detectScanType(code) {
  const value = String(code || '').trim().toUpperCase();
  if (value.startsWith('ITEM-')) return { type: 'ITEM', payload: value.slice(5), timestamp: Date.now() };
  if (value.startsWith('BIN-')) return { type: 'BIN', payload: value.slice(4), timestamp: Date.now() };
  return { type: 'UNKNOWN', payload: value, timestamp: Date.now() };
}

export function parseInventoryCSV(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.slice(1).map((line) => {
    const [sku, description, bin, qty, capacity] = line.split(',').map((v) => v.trim());
    return { sku, description, bin, qty: Number(qty || 0), capacity: Number(capacity || 0) };
  });

  const inventory = {};
  const bins = {};

  for (const row of rows) {
    if (!row.sku || !row.bin) continue;
    if (!inventory[row.sku]) {
      inventory[row.sku] = { id: row.sku, description: row.description, totalQty: 0, locations: [] };
    }
    inventory[row.sku].totalQty += row.qty;
    inventory[row.sku].locations.push({ bin: row.bin, qty: row.qty });

    if (!bins[row.bin]) {
      bins[row.bin] = { id: row.bin, currentSKUs: [], capacity: row.capacity || 0 };
    }
    bins[row.bin].currentSKUs.push({ skuId: row.sku, qty: row.qty });
  }

  return { inventory, bins, rowsImported: rows.length };
}

export function generateRemiseTasks(state) {
  const tasks = [];
  let i = 1;
  for (const sku of Object.values(state.inventory)) {
    const candidate = sku.locations.find((l) => l.qty > 0);
    if (!candidate) continue;
    tasks.push({
      id: `REM-${String(i++).padStart(4, '0')}`,
      items: [{ skuId: sku.id, bin: candidate.bin, qty: Math.min(candidate.qty, 5) }],
      status: 'pending',
    });
  }
  return tasks;
}

export function generateConsolidationTasks(state) {
  const proposals = [];
  for (const [skuId, sku] of Object.entries(state.inventory)) {
    if (sku.locations.length < 2) continue;
    const sorted = [...sku.locations].sort((a, b) => a.qty - b.qty);
    const from = sorted[0];
    const to = sorted[sorted.length - 1];
    proposals.push({ skuId, fromBin: from.bin, toBin: to.bin, qty: from.qty, reason: 'Réduire la fragmentation du SKU' });
  }
  return proposals;
}

export function createPalette(state, orderRef) {
  const id = `PAL-${Date.now()}`;
  const palette = { id, orderRef: orderRef || 'N/A', createdAt: new Date().toISOString() };
  state.palettes.unshift(palette);
  return palette;
}

export function transferStock(state, { fromBin, toBin, skuId, qty }) {
  const quantity = Number(qty);
  if (!state.bins[fromBin] || !state.bins[toBin] || !state.inventory[skuId]) {
    throw new Error('Bin ou SKU introuvable');
  }
  if (quantity <= 0) throw new Error('Quantité invalide');

  const sourceEntry = state.bins[fromBin].currentSKUs.find((s) => s.skuId === skuId);
  if (!sourceEntry || sourceEntry.qty < quantity) throw new Error('Stock insuffisant dans le bin source');

  sourceEntry.qty -= quantity;
  let targetEntry = state.bins[toBin].currentSKUs.find((s) => s.skuId === skuId);
  if (!targetEntry) {
    targetEntry = { skuId, qty: 0 };
    state.bins[toBin].currentSKUs.push(targetEntry);
  }
  targetEntry.qty += quantity;

  const transfer = { fromBin, toBin, skuId, qty: quantity, ts: new Date().toISOString() };
  state.transfers.unshift(transfer);
  return transfer;
}

export async function testAiConnection(endpoint, apiKey) {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  });
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

export function buildInventoryTable(state) {
  const rows = Object.values(state.inventory)
    .map((sku) => `<tr><td>${sku.id}</td><td>${sku.description || ''}</td><td>${sku.totalQty}</td><td>${sku.locations.map((l) => `${l.bin}:${l.qty}`).join(', ')}</td></tr>`)
    .join('');

  return `<table>
    <thead><tr><th>SKU</th><th>Description</th><th>Total</th><th>Emplacements</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Aucune donnée</td></tr>'}</tbody>
  </table>`;
}
