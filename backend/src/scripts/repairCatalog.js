import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CatalogValidator, CatalogRepair, CatalogReport } from '../services/catalogIntelligence/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('\n======================================================');
  console.log('        Meesho Sakhi — Catalog Repair Utility         ');
  console.log('======================================================\n');

  const catalogPath = path.resolve(__dirname, '..', '..', 'catalog.json');
  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  console.log(`Analyzing ${rawCatalog.length} products for repair...`);
  const validator = new CatalogValidator({ checkReachability: false });
  const evaluated = await validator.validateCatalog(rawCatalog, { fastMode: true });

  const { repairedCatalog, repairLog } = CatalogRepair.repairCatalog(evaluated);

  console.log(`Repaired ${repairLog.length} product entries with verified images.`);

  // Write repaired catalog backup and updated catalog.json
  const backupPath = path.resolve(__dirname, '..', '..', 'catalog.backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(rawCatalog, null, 2), 'utf8');
  fs.writeFileSync(catalogPath, JSON.stringify(repairedCatalog, null, 2), 'utf8');

  // Re-validate repaired catalog to verify results
  const reEvaluated = await validator.validateCatalog(repairedCatalog, { fastMode: true });
  const reReport = CatalogReport.buildReportData(reEvaluated);

  console.log('\nPost-Repair Status:');
  console.log(`  Total Products:       ${reReport.summary.totalProducts}`);
  console.log(`  Valid Products:       ${reReport.summary.validProducts}`);
  console.log(`  Mismatched Images:    ${reReport.summary.mismatchedImages}`);
  console.log(`  Duplicate Images:     ${reReport.summary.duplicateImages}`);

  const jsonReportPath = path.resolve(__dirname, '..', '..', 'catalog-validation-report.json');
  const htmlReportPath = path.resolve(__dirname, '..', '..', 'catalog-validation-report.html');
  CatalogReport.writeJsonReport(reReport, jsonReportPath);
  CatalogReport.writeHtmlReport(reReport, htmlReportPath);

  console.log(`\nCatalog repaired and updated successfully.`);
}

run().catch(err => {
  console.error('Fatal repair error:', err);
  process.exit(1);
});
