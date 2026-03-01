import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectScanType,
  parseInventoryCSV,
  generateConsolidationTasks,
} from '../src/wms-core.js';

test('detectScanType identifies item and bin', () => {
  assert.equal(detectScanType('ITEM-sku01').type, 'ITEM');
  assert.equal(detectScanType('BIN-a1').type, 'BIN');
  assert.equal(detectScanType('xyz').type, 'UNKNOWN');
});

test('parseInventoryCSV aggregates qty by sku', () => {
  const csv = `sku,description,bin,qty,capacity\nSKU1,Prod A,A01,5,50\nSKU1,Prod A,A02,3,50`;
  const result = parseInventoryCSV(csv);
  assert.equal(result.inventory.SKU1.totalQty, 8);
  assert.equal(result.inventory.SKU1.locations.length, 2);
});

test('generateConsolidationTasks creates suggestion for fragmented sku', () => {
  const state = {
    inventory: {
      SKU1: { id: 'SKU1', locations: [{ bin: 'A01', qty: 1 }, { bin: 'A02', qty: 8 }] },
    },
  };
  const suggestions = generateConsolidationTasks(state);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].fromBin, 'A01');
  assert.equal(suggestions[0].toBin, 'A02');
});
