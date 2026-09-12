import assert from 'assert';
import { routeIntent } from '../src/utils/intentRouter.js';

const testCases = [
  { input: "Hello", expected: "greeting" },
  { input: "Hi Sakhi", expected: "greeting" },
  { input: "Good morning", expected: "greeting" },
  { input: "Thanks", expected: "gratitude" },
  { input: "What can you do?", expected: "general_chat" },
  { input: "Tell me about yourself", expected: "general_chat" },
  { input: "Show me electronics under 2000", expected: "shopping" },
  { input: "I need something for my kitchen", expected: "shopping" },
  { input: "Which one has the best rating?", expected: "product_question" },
  { input: "Show me something cheaper", expected: "shopping_followup" },
  { input: "asdf random message", expected: "unclear" }
];

let allPassed = true;

for (const { input, expected } of testCases) {
  const result = routeIntent(input);
  if (result.intent !== expected) {
    console.error(`❌ Test failed for "${input}": Expected ${expected}, got ${result.intent}`);
    allPassed = false;
  } else {
    console.log(`✅ Test passed for "${input}": ${result.intent}`);
  }
}

if (allPassed) {
  console.log("All intent router tests passed!");
} else {
  process.exit(1);
}
