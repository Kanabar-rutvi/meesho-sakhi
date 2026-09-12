import { AgentOrchestrator } from '../src/utils/orchestrator.js';
import prisma from '../src/utils/db.js';

async function runTest() {
  const catalog = "test_catalog";
  // Create dummy user for test
  let user;
  try {
    user = await prisma.user.findFirst({ where: { email: 'test_manual_orchestrator@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test_manual_orchestrator@example.com',
          name: 'Test User',
          password_hash: 'dummy'
        }
      });
    }
  } catch (e) {
    console.error("Failed to connect/create user, running without user. Error:", e.message);
  }

  const orchestrator = new AgentOrchestrator(
    catalog, 
    user ? user.id : null, 
    "session-123", 
    "conversation-123", 
    null
  );

  const query = "Hello, I want to shop for my sister a dress under 800";
  console.log("Starting test for query:", query);

  try {
    for await (const sseChunk of orchestrator.executeFullPlan(query)) {
      console.log(sseChunk.trim());
    }
    console.log("Orchestrator finished successfully.");
  } catch (err) {
    console.error("Orchestrator failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
