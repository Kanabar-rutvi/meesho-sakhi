import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');
  
  // Clear existing data (optional, but requested by user to "empty and again seed")
  await prisma.cartItem.deleteMany();
  await prisma.shoppingPlan.deleteMany();
  await prisma.userFeedback.deleteMany();
  await prisma.interactionHistory.deleteMany();
  await prisma.learnedPreferences.deleteMany();
  await prisma.shoppingGoal.deleteMany();
  await prisma.user.deleteMany();

  // Create a demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@meesho-sakhi.com',
      hashed_password: 'hashed_password_placeholder',
      name: 'Demo User',
      role: 'user',
      preferences: {
        create: {
          category_scores: JSON.stringify({ electronics: 5, fashion: 3 }),
          brand_scores: JSON.stringify({}),
          tag_scores: JSON.stringify({}),
        }
      }
    }
  });

  // Create a shopping goal
  const goal = await prisma.shoppingGoal.create({
    data: {
      user_id: user.id,
      query: 'I need a new hostel setup for 5000',
      budget: 5000,
      status: 'completed'
    }
  });

  // Create a shopping plan
  const plan = await prisma.shoppingPlan.create({
    data: {
      goal_id: goal.id,
      name: 'Hostel Setup Plan',
      total_budget: 4500,
      is_saved: true
    }
  });

  // Create some cart items
  await prisma.cartItem.createMany({
    data: [
      {
        plan_id: plan.id,
        product_id: 'prod_1',
        name: 'Study Lamp',
        category: 'electronics',
        price: 500,
        quantity: 1,
        trust_score: 95.5,
        reason: 'Highly rated for students.'
      },
      {
        plan_id: plan.id,
        product_id: 'prod_2',
        name: 'Bed Sheet',
        category: 'home',
        price: 400,
        quantity: 2,
        trust_score: 88.0,
        reason: 'Durable cotton.'
      }
    ]
  });

  console.log('Data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
