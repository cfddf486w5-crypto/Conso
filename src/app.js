import {
  loadState,
  saveState,
  detectScanType,
  parseInventoryCSV,
  generateRemiseTasks,
  generateConsolidationTasks,
  createPalette,
  transferStock,
  testAiConnection,
  buildInventoryTable,
} from './wms-core.js';

const ui = {
  csvFile: document.getElementById('csvFile'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importResult: document.getElementById('importResult'),
  scanInput: document.getElementById('scanInput'),
  scanBtn: document.getElementById('scanBtn'),
  scanResult: document.getElementById('scanResult'),
  remiseBtn: document.getElementById('remiseBtn'),
  consoBtn: document.getElementById('consoBtn'),
  taskResult: document.getElementById('taskResult'),
  orderRef: document.getElementById('orderRef'),
  paletteBtn: document.getElementById('paletteBtn'),
  fromBin: document.getElementById('fromBin'),
  toBin: document.getElementById('toBin'),
  transferSku: document.getElementById('transferSku'),
  transferQty: document.getElementById('transferQty'),
  transferBtn: document.getElementById('transferBtn'),
  opsResult: document.getElementById('opsResult'),
  aiEndpoint: document.getElementById('aiEndpoint'),
  aiKey: document.getElementById('aiKey'),
  aiPrompt: document.getElementById('aiPrompt'),
  saveAiBtn: document.getElementById('saveAiBtn'),
  testAiBtn: document.getElementById('testAiBtn'),
  aiResult: document.getElementById('aiResult'),
  inventoryGrid: document.getElementById('inventoryGrid'),
};

const state = loadState();
ui.aiEndpoint.value = state.ai.endpoint;
ui.aiKey.value = state.ai.apiKey || '';

const render = () => {
  ui.inventoryGrid.innerHTML = buildInventoryTable(state);
};

ui.importBtn.addEventListener('click', async () => {
  const file = ui.csvFile.files?.[0];
  if (!file) {
    ui.importResult.textContent = 'Aucun fichier sélectionné.';
    return;
  }
  const text = await file.text();
  const parsed = parseInventoryCSV(text);
  state.inventory = parsed.inventory;
  state.bins = parsed.bins;
  saveState(state);
  render();
  ui.importResult.textContent = JSON.stringify({ message: 'Import réussi', ...parsed }, null, 2);
});

ui.exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wms-export-${Date.now()}.json`;
  a.click();
});

ui.scanBtn.addEventListener('click', () => {
  const scan = detectScanType(ui.scanInput.value);
  if (scan.type === 'ITEM') {
    scan.match = state.inventory[scan.payload] || null;
  }
  if (scan.type === 'BIN') {
    scan.match = state.bins[scan.payload] || null;
  }
  ui.scanResult.textContent = JSON.stringify(scan, null, 2);
});

ui.remiseBtn.addEventListener('click', () => {
  state.remises = generateRemiseTasks(state);
  saveState(state);
  ui.taskResult.textContent = JSON.stringify(state.remises, null, 2);
});

ui.consoBtn.addEventListener('click', () => {
  const proposals = generateConsolidationTasks(state);
  ui.taskResult.textContent = JSON.stringify(proposals, null, 2);
});

ui.paletteBtn.addEventListener('click', () => {
  const palette = createPalette(state, ui.orderRef.value);
  saveState(state);
  ui.opsResult.textContent = JSON.stringify({ message: 'Palette créée', palette }, null, 2);
});

ui.transferBtn.addEventListener('click', () => {
  try {
    const transfer = transferStock(state, {
      fromBin: ui.fromBin.value,
      toBin: ui.toBin.value,
      skuId: ui.transferSku.value,
      qty: ui.transferQty.value,
    });
    saveState(state);
    render();
    ui.opsResult.textContent = JSON.stringify({ message: 'Transfert validé', transfer }, null, 2);
  } catch (err) {
    ui.opsResult.textContent = String(err.message || err);
  }
});

ui.saveAiBtn.addEventListener('click', () => {
  state.ai.endpoint = ui.aiEndpoint.value;
  state.ai.apiKey = ui.aiKey.value;
  state.ai.prompt = ui.aiPrompt.value;
  saveState(state);
  ui.aiResult.textContent = 'Configuration IA sauvegardée localement.';
});

ui.testAiBtn.addEventListener('click', async () => {
  ui.aiResult.textContent = 'Test en cours...';
  try {
    const result = await testAiConnection(ui.aiEndpoint.value, ui.aiKey.value);
    ui.aiResult.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    ui.aiResult.textContent = `Échec connexion IA: ${error.message}`;
  }
});

render();
