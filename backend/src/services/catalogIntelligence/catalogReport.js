/**
 * Catalog Report Generator
 *
 * Generates structured JSON and interactive HTML reports documenting
 * catalog quality, validation states, mismatches, and repair recommendations.
 */

import fs from 'fs';
import path from 'path';
import { VALIDATION_STATES } from './confidenceScorer.js';
import { REPAIR_ACTIONS, CatalogRepair } from './catalogRepair.js';

export class CatalogReport {
  /**
   * Calculate summary statistics from evaluated products
   * @param {object[]} evaluatedProducts
   * @returns {object} statistics summary
   */
  static generateStats(evaluatedProducts) {
    const stats = {
      totalProducts: evaluatedProducts.length,
      validProducts: 0,
      mismatchedImages: 0,
      duplicateImages: 0,
      brokenImages: 0,
      needsReview: 0,
      repairableProducts: 0
    };

    for (const item of evaluatedProducts) {
      if (item.status === VALIDATION_STATES.VALID) stats.validProducts++;
      else if (item.status === VALIDATION_STATES.MISMATCH) stats.mismatchedImages++;
      else if (item.status === VALIDATION_STATES.DUPLICATE_IMAGE) stats.duplicateImages++;
      else if (item.status === VALIDATION_STATES.BROKEN_IMAGE) stats.brokenImages++;
      else if (item.status === VALIDATION_STATES.NEEDS_REVIEW) stats.needsReview++;

      const repairPlan = CatalogRepair.evaluateRepairAction(item);
      if (repairPlan.action === REPAIR_ACTIONS.AUTO_FIX) {
        stats.repairableProducts++;
      }
    }

    return stats;
  }

  /**
   * Generate JSON report data structure
   * @param {object[]} evaluatedProducts
   * @returns {object} full report object
   */
  static buildReportData(evaluatedProducts) {
    const stats = this.generateStats(evaluatedProducts);
    const products = evaluatedProducts.map(item => {
      const repairPlan = CatalogRepair.evaluateRepairAction(item);
      return {
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        subcategory: item.product.subcategory || null,
        imageUrl: item.product.image_url || item.product.image,
        validationStatus: item.status,
        confidence: item.confidence,
        reason: item.reason,
        suggestedAction: repairPlan.action,
        suggestedImageUrl: repairPlan.suggestedImageUrl
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: stats,
      products
    };
  }

  /**
   * Save JSON report to file
   * @param {object} reportData
   * @param {string} filePath
   */
  static writeJsonReport(reportData, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2), 'utf8');
  }

  /**
   * Generate visual HTML report string
   * @param {object} reportData
   * @returns {string} HTML document
   */
  static generateHtmlReport(reportData) {
    const { summary, products, generatedAt } = reportData;

    const statusBadge = (status) => {
      switch (status) {
        case 'VALID':
          return '<span style="background:#064e3b;color:#34d399;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">VALID</span>';
        case 'MISMATCH':
          return '<span style="background:#7f1d1d;color:#f87171;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">MISMATCH</span>';
        case 'DUPLICATE_IMAGE':
          return '<span style="background:#78350f;color:#fbbf24;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">DUPLICATE</span>';
        case 'BROKEN_IMAGE':
          return '<span style="background:#450a0a;color:#fca5a5;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">BROKEN</span>';
        default:
          return '<span style="background:#312e81;color:#a5b4fc;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">REVIEW</span>';
      }
    };

    const actionBadge = (action) => {
      if (action === 'AUTO_FIX') {
        return '<span style="background:#1e3a8a;color:#93c5fd;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:600;">AUTO_FIX</span>';
      }
      if (action === 'VALID') {
        return '<span style="background:#14532d;color:#86efac;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:600;">NONE</span>';
      }
      return '<span style="background:#374151;color:#d1d5db;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:600;">MANUAL</span>';
    };

    const rows = products.map(p => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#94a3b8;">${p.productId}</td>
        <td style="padding:10px 12px;font-weight:600;color:#f8fafc;">${p.productName}</td>
        <td style="padding:10px 12px;color:#cbd5e1;">${p.category}</td>
        <td style="padding:10px 12px;">
          <a href="${p.imageUrl}" target="_blank" style="text-decoration:none;">
            <img src="${p.imageUrl}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #334155;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect fill=\\'%23334155\\' width=\\'40\\' height=\\'40\\'/><text x=\\'20\\' y=\\'25\\' font-size=\\'10\\' fill=\\'%2394a3b8\\' text-anchor=\\'middle\\'>Error</text></svg>'" />
          </a>
        </td>
        <td style="padding:10px 12px;">${statusBadge(p.validationStatus)}</td>
        <td style="padding:10px 12px;font-weight:700;color:${p.confidence >= 0.7 ? '#34d399' : p.confidence < 0.35 ? '#f87171' : '#fbbf24'};">${(p.confidence * 100).toFixed(0)}%</td>
        <td style="padding:10px 12px;font-size:12px;color:#94a3b8;max-width:280px;">${p.reason}</td>
        <td style="padding:10px 12px;">${actionBadge(p.suggestedAction)}</td>
      </tr>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Meesho Sakhi — Catalog Validation Report</title>
  <style>
    body { margin: 0; padding: 32px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f1f5f9; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 28px; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
    .stat-num { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
    .table-container { background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #0f172a; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="margin:0 0 6px 0; font-size:24px;">Catalog Validation Audit Report</h1>
        <div style="color:#94a3b8; font-size:13px;">Meesho Sakhi AI Catalog Intelligence Pipeline</div>
      </div>
      <div style="color:#64748b; font-size:12px;">Generated: ${new Date(generatedAt).toLocaleString()}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num" style="color:#f8fafc;">${summary.totalProducts}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#34d399;">${summary.validProducts}</div>
        <div class="stat-label">Valid Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#f87171;">${summary.mismatchedImages}</div>
        <div class="stat-label">Mismatched Images</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#fbbf24;">${summary.duplicateImages}</div>
        <div class="stat-label">Duplicate Images</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#fca5a5;">${summary.brokenImages}</div>
        <div class="stat-label">Broken Images</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#a5b4fc;">${summary.needsReview}</div>
        <div class="stat-label">Needs Review</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#60a5fa;">${summary.repairableProducts}</div>
        <div class="stat-label">Auto-Repairable</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Image</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Reason</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Save visual HTML report to file
   * @param {object} reportData
   * @param {string} filePath
   */
  static writeHtmlReport(reportData, filePath) {
    const html = this.generateHtmlReport(reportData);
    fs.writeFileSync(filePath, html, 'utf8');
  }
}
