/**
 * Embedding Service
 *
 * Generates and indexes text and image embeddings for fast semantic vector search.
 * Includes disk caching (catalog-embeddings.json) so embeddings are precomputed
 * and loaded into memory on startup without recomputing per user request.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVisionProvider } from '../catalogIntelligence/visionProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMBEDDING_CACHE_FILE = path.resolve(__dirname, '..', '..', '..', 'catalog-embeddings.json');

const EMBEDDING_DIM = 48;

export class EmbeddingService {
  constructor() {
    this.visionProvider = getVisionProvider();
    // In-memory embedding index: productId -> { textVector, imageVector }
    this.index = new Map();
    this.isLoaded = false;
  }

  /**
   * Tokenize text into normalized n-grams / terms
   * @param {string} text
   * @returns {string[]}
   */
  _tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  /**
   * Generate a normalized dense vector embedding from structured product text
   * @param {string} text
   * @returns {number[]} normalized vector
   */
  generateTextEmbedding(text) {
    const tokens = this._tokenize(text);
    const vec = new Array(EMBEDDING_DIM).fill(0);

    if (tokens.length === 0) return vec;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // TF weight with position decay
      const weight = 1.0 / Math.sqrt(i + 1);

      // Primary token hash
      let h1 = 0;
      for (let j = 0; j < token.length; j++) {
        h1 = (h1 * 37 + token.charCodeAt(j)) >>> 0;
      }
      vec[h1 % EMBEDDING_DIM] += weight * 1.5;

      // Bi-gram hash for word-pair semantics
      if (i > 0) {
        const bigram = tokens[i - 1] + '_' + token;
        let h2 = 0;
        for (let k = 0; k < bigram.length; k++) {
          h2 = (h2 * 31 + bigram.charCodeAt(k)) >>> 0;
        }
        vec[h2 % EMBEDDING_DIM] += weight * 1.0;
      }
    }

    // L2 normalization
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return vec.map(v => Math.round((v / norm) * 10000) / 10000);
  }

  /**
   * Generate image feature embedding via VisionProvider
   * @param {string} imageUrl
   * @returns {Promise<number[]>} normalized image vector
   */
  async generateImageEmbedding(imageUrl) {
    try {
      const raw = await this.visionProvider.generateImageEmbedding(imageUrl);
      // Pad or project to EMBEDDING_DIM
      const vec = new Array(EMBEDDING_DIM).fill(0);
      for (let i = 0; i < raw.length; i++) {
        vec[i % EMBEDDING_DIM] += raw[i];
      }
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map(v => Math.round((v / norm) * 10000) / 10000);
    } catch {
      return new Array(EMBEDDING_DIM).fill(0);
    }
  }

  /**
   * Compute cosine similarity between two unit vectors
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number} float in [0, 1]
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }

  /**
   * Index all products in memory, reading from disk cache if available
   * @param {object[]} products
   * @returns {Promise<number>} count of indexed products
   */
  async indexCatalog(products, forceRecompute = false) {
    if (!forceRecompute && fs.existsSync(EMBEDDING_CACHE_FILE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(EMBEDDING_CACHE_FILE, 'utf8'));
        if (cached && cached.count === products.length && cached.version === 2) {
          for (const [id, entry] of Object.entries(cached.embeddings)) {
            this.index.set(id, entry);
          }
          this.isLoaded = true;
          return this.index.size;
        }
      } catch (err) {
        console.warn("[EmbeddingService] Cache read error, recomputing:", err.message);
      }
    }

    // Compute embeddings
    const cacheData = {
      version: 2,
      count: products.length,
      generatedAt: new Date().toISOString(),
      embeddings: {}
    };

    for (const prod of products) {
      const textToEmbed = [
        prod.name,
        prod.category,
        prod.subcategory || '',
        prod.brand || '',
        (prod.tags || []).join(' '),
        prod.description || '',
        Object.entries(prod.attributes || {}).map(([k, v]) => `${k}:${v}`).join(' ')
      ].join(' ');

      const textVector = this.generateTextEmbedding(textToEmbed);
      const imgUrl = prod.image_url || prod.image;
      const imageVector = imgUrl ? await this.generateImageEmbedding(imgUrl) : new Array(EMBEDDING_DIM).fill(0);

      const entry = { textVector, imageVector };
      this.index.set(prod.id, entry);
      cacheData.embeddings[prod.id] = entry;
    }

    try {
      fs.writeFileSync(EMBEDDING_CACHE_FILE, JSON.stringify(cacheData), 'utf8');
    } catch (err) {
      console.warn("[EmbeddingService] Failed to write cache:", err.message);
    }

    this.isLoaded = true;
    return this.index.size;
  }

  /**
   * Get semantic similarity between a query text and a product ID
   * @param {string} queryText
   * @param {string} productId
   * @returns {number} similarity in [0, 1]
   */
  getSemanticSimilarity(queryText, productId) {
    const entry = this.index.get(productId);
    if (!entry || !queryText) return 0.5;

    const queryVec = this.generateTextEmbedding(queryText);
    return this.cosineSimilarity(queryVec, entry.textVector);
  }

  /**
   * Get visual similarity between an image URL or image embedding and a product ID
   * @param {string} imageUrl
   * @param {string} productId
   * @returns {Promise<number>} similarity in [0, 1]
   */
  async getVisualSimilarity(imageUrl, productId) {
    const entry = this.index.get(productId);
    if (!entry || !imageUrl) return 0.5;

    const queryImgVec = await this.generateImageEmbedding(imageUrl);
    return this.cosineSimilarity(queryImgVec, entry.imageVector);
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
