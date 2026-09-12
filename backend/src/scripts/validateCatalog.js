import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CatalogValidator, CatalogReport } from '../services/catalogIntelligence/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('\n======================================================');
  console.log('      Meesho Sakhi — Catalog Validation Pipeline      ');
  console.log('======================================================\n');

  const catalogPath = path.resolve(__dirname, '..', '..', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`Error: catalog.json not found at ${catalogPath}`);
    process.exit(1);
  }

  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${rawCatalog.length} products from catalog.json.`);
  console.log('Running validation checks (visual-semantic match, duplicates, taxonomy)...');

  const validator = new CatalogValidator({ checkReachability: true });
  const evaluated = await validator.validateCatalog(rawCatalog, { fastMode: true });

  const reportData = CatalogReport.buildReportData(evaluated);
  const { summary } = reportData;

  console.log('\nValidation Summary:');
  console.log(`  Total Products:       ${summary.totalProducts}`);
  console.log(`  Valid Products:       ${summary.validProducts}`);
  console.log(`  Mismatched Images:    ${summary.mismatchedImages}`);
  console.log(`  Duplicate Images:     ${summary.duplicateImages}`);
  console.log(`  Broken Images:        ${summary.brokenImages}`);
  console.log(`  Needs Review:         ${summary.needsReview}`);
  console.log(`  Auto-Repairable:      ${summary.repairableProducts}`);

  const jsonReportPath = path.resolve(__dirname, '..', '..', 'catalog-validation-report.json');
  const htmlReportPath = path.resolve(__dirname, '..', '..', 'catalog-validation-report.html');

  CatalogReport.writeJsonReport(reportData, jsonReportPath);
  CatalogReport.writeHtmlReport(reportData, htmlReportPath);

  console.log(`\nReports generated successfully:`);
  console.log(`  JSON: ${jsonReportPath}`);
  console.log(`  HTML: ${htmlReportPath}\n`);
}

run().catch(err => {
  console.error('Fatal validation error:', err);
  process.exit(1);
});
