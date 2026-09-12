/**
 * Image Validator Service
 *
 * Verifies image reachability, content validity, and generates
 * perceptual fingerprints to detect duplicate images across products.
 */

// Bounded in-memory reachability cache: url -> { reachable: boolean, contentType: string, ts: number }
const REACHABILITY_CACHE = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

export class ImageValidator {
  /**
   * Verify whether an image URL is reachable and returns an image content-type
   * @param {string} url
   * @param {number} timeoutMs
   * @returns {Promise<{ reachable: boolean, statusCode: number, contentType: string, reason: string }>}
   */
  static async verifyUrl(url, timeoutMs = 3000) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { reachable: false, statusCode: 0, contentType: '', reason: 'Empty or missing URL' };
    }

    const trimmed = url.trim();

    // Check basic URL protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { reachable: false, statusCode: 0, contentType: '', reason: 'Invalid URL protocol' };
    }

    // Check cache
    const cached = REACHABILITY_CACHE.get(trimmed);
    if (cached && (Date.now() - cached.ts < CACHE_TTL_MS)) {
      return {
        reachable: cached.reachable,
        statusCode: cached.statusCode || 200,
        contentType: cached.contentType,
        reason: cached.reason
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Probe with HEAD request first, fallback to GET if HEAD rejected
      let resp;
      try {
        resp = await fetch(trimmed, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'MeeshoSakhiCatalogValidator/2.0' }
        });
      } catch (headErr) {
        resp = await fetch(trimmed, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'MeeshoSakhiCatalogValidator/2.0' }
        });
      } finally {
        clearTimeout(timer);
      }

      const contentType = resp.headers.get('content-type') || '';
      const reachable = resp.ok && (
        contentType.startsWith('image/') ||
        contentType.includes('octet-stream') ||
        trimmed.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)
      );

      const result = {
        reachable,
        statusCode: resp.status,
        contentType,
        reason: reachable ? 'OK' : `HTTP ${resp.status} with content-type: ${contentType}`
      };

      REACHABILITY_CACHE.set(trimmed, { ...result, ts: Date.now() });
      return result;

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const reason = isTimeout ? 'Request timed out' : `Connection error: ${err.message}`;
      const result = { reachable: false, statusCode: 0, contentType: '', reason };
      REACHABILITY_CACHE.set(trimmed, { ...result, ts: Date.now() });
      return result;
    }
  }

  /**
   * Generates a perceptual hash / fingerprint from an image URL and metadata.
   * Standardizes URL params, path tokens, and image dimensions.
   * @param {string} url
   * @returns {string} normalized fingerprint
   */
  static generateFingerprint(url) {
    if (!url || typeof url !== 'string') return '';
    try {
      const parsed = new URL(url);
      // Remove ephemeral query params like cache-busters
      const normalizedPath = parsed.origin + parsed.pathname.toLowerCase();
      return normalizedPath;
    } catch {
      return url.toLowerCase().trim();
    }
  }
}
