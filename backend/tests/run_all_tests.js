/**
 * Master Test Runner for Meesho Sakhi
 * Executes all test suites across Catalog, Ingestion, Intelligence, Search, ML Ranking, and Personalization.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILES = [
  'test_catalog.js',
  'test_catalog_architecture.js',
  'test_product_search_service.js',
  'test_intent_router.js',
  'test_conversation_context.js',
  'test_recommendation_architecture.js',
  'test_catalog_validation.js',
  'test_real_marketplace_catalog.js',
  'test_hybrid_search.js',
  'test_ranking_service.js',
  'test_personalization_service.js'
];

async function runTest(file) {
  return new Promise((resolve) => {
    const fullPath = path.resolve(__dirname, file);
    const proc = spawn(process.execPath, [fullPath], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    proc.on('close', (code) => {
      resolve({ file, passed: code === 0, code });
    });
  });
}

async function main() {
  console.log('===========================================================');
  console.log('       Meesho Sakhi — Full Test Suite Execution           ');
  console.log('===========================================================');

  const startTime = Date.now();
  const results = [];

  for (const testFile of TEST_FILES) {
    console.log(`\n▶ Running: ${testFile}`);
    const res = await runTest(testFile);
    results.push(res);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n===========================================================');
  console.log(`Summary: ${passed}/${results.length} test suites passed (${duration}s)`);
  console.log('===========================================================');

  for (const r of results) {
    console.log(`  ${r.passed ? '✅ PASS' : '❌ FAIL'}: ${r.file}`);
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} test suite(s) failed.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 10 TEST SUITES PASSED CLEANLY!\n');
    process.exit(0);
  }
}

main();
