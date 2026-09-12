/**
 * ML Recommendation Model Interface
 *
 * This is a pluggable model abstraction. Currently implements a deterministic
 * placeholder. Future models (collaborative filtering, LightFM, embeddings)
 * can be swapped in here without changing any caller.
 *
 * Possible future implementations:
 *   - Collaborative filtering (user-item matrix)
 *   - Content-based filtering (product attribute similarity)
 *   - Matrix factorization (ALS, SVD)
 *   - LightFM (hybrid FM)
 *   - Implicit feedback model (BPR)
 *   - Embeddings / vector search (pgvector, Pinecone)
 *   - Neural ranking (two-tower model)
 *
 * Contract:
 *   predict(features, products) → { scores: number[], source: string } | null
 *
 * Returning null means "model unavailable — caller should use deterministic fallback".
 */

export const MODEL_VERSION = 'placeholder-v0';

/**
 * Predict relevance scores for a list of products given user features.
 *
 * @param {object} features   - output of recommendationFeatures.extractFeatures()
 * @param {object[]} products - candidate products from search
 * @returns {{ scores: number[], source: string } | null}
 *          null = model unavailable, caller must use deterministic fallback
 */
export function predict(features, products) {
  // TODO: Replace this body with a real trained model call.
  // Possible implementations:
  //   1. HTTP call to a Python ML microservice
  //   2. ONNX Runtime inference in Node.js
  //   3. TensorFlow.js model loaded from disk
  //   4. Supabase pgvector similarity query
  //
  // For now: return null so recommendationService uses deterministic ranking.
  return null;
}

/**
 * Load or initialise the model.
 * Currently a no-op. Future: load ONNX weights, connect to feature store, etc.
 */
export async function loadModel() {
  // TODO: initialise model weights / connections here
  console.log(`[mlRecommendationModel] Model ${MODEL_VERSION} is placeholder — using deterministic fallback.`);
}
