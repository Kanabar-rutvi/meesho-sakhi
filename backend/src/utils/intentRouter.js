/**
 * Intent Router
 *
 * Deterministic conversational intent classification.
 * All classification here uses zero Claude calls.
 *
 * Intents:
 *   greeting          - hello, hi, hey
 *   gratitude         - thanks, thank you
 *   general_chat      - what can you do, who are you
 *   product_detail    - tell me more about the first one, describe the second product
 *   product_question  - which is cheapest, which has best rating, price of first one
 *   product_comparison- compare the two, which one is better
 *   shopping_followup - show me cheaper, something better, show more, change budget
 *   budget_change     - make it under 500, change budget to 1500
 *   category_change   - show electronics instead, switch to kitchen
 *   recommendation_request - recommend something, suggest products
 *   shopping          - fresh shopping intent with category/budget/product keyword
 *   unclear           - cannot classify
 */

// ─── Word lists ────────────────────────────────────────────────────────────────
const GREETINGS = new Set([
  'hello','hi','hey','hey sakhi','hi sakhi','good morning','good evening',
  'good afternoon','greetings','namaste','hii','helo','sup'
]);

const GRATITUDES = new Set([
  'thanks','thank you','thx','thank you so much','thanks a lot',
  'ty','tysm','dhanyavaad','shukriya','bahut shukriya'
]);

const GENERAL_PHRASES = [
  'what can you do','tell me about yourself','how can you help me',
  'who are you','what are you','help me','what do you do',
  'what are your features','how does this work','what is sakhi',
];

// Product detail triggers
const DETAIL_TRIGGERS = [
  'tell me more','tell me about','describe','details of','info on',
  'what about','more about','more info','give me more','elaborate',
];

// Plan information triggers
const PLAN_INFO_TRIGGERS = [
  'what is in my plan','what is in my cart','what did you pick','show my plan',
  'show my cart','what products are in my plan','what items are in my plan',
  'what products did you pick','what do i have','items in my plan','products in my plan',
  'what is in the cart','show items in plan'
];

// Ordinal words used for product references
const ORDINALS = ['first','second','third','fourth','fifth','1st','2nd','3rd','4th','5th'];

// Question-about-products triggers
const QUESTION_WORDS = [
  'which is cheaper','which one is cheaper','cheapest','most affordable',
  'which has best rating','highest rated','best rating','best rated',
  'how many reviews','most reviews','most reviewed',
  'what is the price','price of','how much is','how much does',
  'which is better','which one is better','which should i buy',
];

// Shopping follow-up signals (must NOT have fresh category signal)
const FOLLOWUP_WORDS = [
  'cheaper','more','better','another option','different','similar',
  'show me more','something else','other options','alternatives',
  'show more','any more','give me more options'
];

// Budget modification
const BUDGET_PATTERNS = [
  /under\s+(\d+)/, /below\s+(\d+)/, /within\s+(\d+)/,
  /budget.*?(\d+)/, /change.*?budget.*?(\d+)/, /(\d+).*?budget/,
  /max.*?(\d+)/, /up\s+to\s+(\d+)/,
];

// Category change patterns
const CATEGORY_CHANGE = [
  'show me electronics instead','show electronics instead','switch to kitchen',
  'show kitchen','i want electronics instead','show study','switch to study',
  'change to electronics','change to kitchen','no more','i don\'t want',
  'instead show','instead of'
];

// Known shopping categories from the taxonomy
const KNOWN_CATEGORIES = [
  'bedding','study','kitchen','storage','electronics','hygiene',
  'home','personal_care','laptop','phone','audio','furniture'
];

const SHOPPING_WORDS = [
  'show me','need','find','buy','looking for','want','get me',
  'recommend','suggest','search for','i want','give me','find me'
];

// ─── Main router ───────────────────────────────────────────────────────────────
export function routeIntent(query) {
  const raw = query.trim();
  const q   = raw.toLowerCase().replace(/[.!?]+$/, '').trim();

  // ── Greeting ────────────────────────────────────────────────────────────────
  if (GREETINGS.has(q)) {
    return {
      intent: 'greeting',
      message: "Hi! 👋 I'm Sakhi, your AI shopping assistant. I can help you find products, compare prices, and shop within your budget. What are you looking for today?"
    };
  }

  // ── Gratitude ───────────────────────────────────────────────────────────────
  if (GRATITUDES.has(q)) {
    return {
      intent: 'gratitude',
      message: "You're welcome! 😊 Let me know if there's anything else I can help you find."
    };
  }

  const hasCategory  = KNOWN_CATEGORIES.some(c => q.includes(c));
  const hasShopWord  = SHOPPING_WORDS.some(w => q.includes(w));
  const hasNumber    = /\d+/.test(q);

  // ── General chat ────────────────────────────────────────────────────────────
  // Only trigger general chat if it's an exact match OR if it's a short query without shopping cues
  const isGeneralChat = GENERAL_PHRASES.some(p => q === p || (q.includes(p) && q.length < 40 && !hasCategory && !hasNumber));
  if (isGeneralChat) {
    return {
      intent: 'general_chat',
      message: "I'm Sakhi — an AI shopping assistant. I can help you:\n• Find products by category, budget, or keyword\n• Compare prices and ratings\n• Discover the best-rated items\n• Build a personalised shopping cart\n\nJust tell me what you need! 🛍️"
    };
  }

  // ── Plan information query: "what is in my plan?", "show my cart" ──────
  if (PLAN_INFO_TRIGGERS.some(t => q.includes(t))) {
    return { intent: 'plan_info' };
  }

  // ── Item removal: "remove the shoes", "delete pillow", "drop first item" ──
  const removeMatch = q.match(/^(?:please\s+)?(?:remove|delete|drop|exclude)\s+(?:the\s+)?([a-z0-9_\s]+)/i);
  if (removeMatch && removeMatch[1]) {
    return { intent: 'item_removal', item_ref: removeMatch[1].trim() };
  }

  // ── Preference update: "i don't like black", "no plastic", "avoid red" ────
  const prefMatch = q.match(/(?:i\s+don't\s+like|no|avoid|hate)\s+(black|white|red|blue|green|yellow|pink|plastic|leather|cotton|wool|synthetic)/i);
  if (prefMatch && prefMatch[1]) {
    return { intent: 'preference_update', preference: prefMatch[1].toLowerCase() };
  }

  // ── Product detail: BEFORE product_question so ordinal+detail wins over question ──
  const hasDetailTrigger = DETAIL_TRIGGERS.some(t => q.includes(t));
  const hasOrdinal       = ORDINALS.some(o => q.includes(o));
  if (hasDetailTrigger || (hasOrdinal && (q.includes('product') || q.includes('option')))) {
    return { intent: 'product_detail' };
  }

  // ── Product question: "which is cheapest?", "best rating?" ─────────────────
  // Note: "price of the X" with ordinal falls to product_detail above; plain price questions land here
  const hasOrdinalInQuestion = ORDINALS.some(o => q.includes(o));
  if (QUESTION_WORDS.some(w => q.includes(w)) && !hasOrdinalInQuestion) {
    return { intent: 'product_question' };
  }
  // Ordinal + price question → product_question (e.g. "what is the price of the first one")
  if (QUESTION_WORDS.some(w => q.includes(w)) && hasOrdinalInQuestion && !hasDetailTrigger) {
    return { intent: 'product_question' };
  }

  // ── Category change: "show electronics instead" ────────────────────────────
  if (CATEGORY_CHANGE.some(p => q.includes(p))) {
    return { intent: 'category_change' };
  }

  // ── Budget change: explicit budget modification without a full new query ────
  const hasBudgetMod = BUDGET_PATTERNS.some(r => r.test(q));
  // Budget change only: has budget pattern but no category/shopping word (i.e. it's modifying not fresh)
  if (hasBudgetMod && !hasCategory && !hasShopWord && q.length < 30) {
    return { intent: 'budget_change' };
  }

  // ── Shopping follow-up: "show me cheaper", "show more", "something similar" ─
  if (FOLLOWUP_WORDS.some(f => q.includes(f)) && !hasCategory) {
    return { intent: 'shopping_followup' };
  }

  // ── Fresh shopping request ──────────────────────────────────────────
  // Requires EITHER a known category OR a number — a vague "want" alone is not enough
  // Also, if the query includes "help me" but bypassed general_chat, it's a shopping request if it has budget/category
  if ((hasCategory && (hasShopWord || hasNumber)) || (hasCategory) || (hasNumber && (hasShopWord || q.includes('help me') || q.includes('need') || q.length > 20))) {
    return { intent: 'shopping' };
  }

  // ── Unclear ─────────────────────────────────────────────────────────
  return {
    intent: 'unclear',
    message: "I'm here to help 😊 Are you looking for a specific product, comparing options, or exploring a category? You can also just tell me your budget!"
  };
}
