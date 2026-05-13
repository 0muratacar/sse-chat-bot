import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@appnation.com' },
    update: {},
    create: {
      email: 'demo@appnation.com',
      name: 'Demo User',
    },
  });

  const chat1 = await prisma.chat.create({
    data: {
      title: 'Getting started with AI',
      userId: user.id,
      messages: {
        create: [
          { role: 'user', content: 'Hello! How can AI help me with coding?' },
          { role: 'assistant', content: 'AI can help you with code generation, debugging, refactoring, and more. What would you like to work on?' },
          { role: 'user', content: 'Can you explain dependency injection?' },
          { role: 'assistant', content: 'Dependency Injection (DI) is a design pattern where dependencies are provided to a class rather than created internally. This makes code more testable and flexible.' },
        ],
      },
    },
  });

  const chat2 = await prisma.chat.create({
    data: {
      title: 'TypeScript best practices',
      userId: user.id,
      messages: {
        create: [
          { role: 'user', content: 'What are some TypeScript best practices?' },
          { role: 'assistant', content: 'Key practices include: strict mode, proper typing over `any`, using interfaces for contracts, leveraging generics, and preferring immutability with readonly.' },
        ],
      },
    },
  });

  const chat3 = await prisma.chat.create({
    data: {
      title: 'Design patterns discussion',
      userId: user.id,
      messages: {
        create: [
          { role: 'user', content: 'Tell me about the Strategy pattern' },
          { role: 'assistant', content: 'The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it.' },
          { role: 'user', content: 'How does it relate to feature flags?' },
          { role: 'assistant', content: 'Feature flags can drive strategy selection at runtime. For example, a streaming flag can switch between SSE and JSON response strategies without code changes.' },
        ],
      },
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: 'STREAMING_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Enable SSE streaming for completion endpoint' },
      { key: 'PAGINATION_LIMIT', value: '20', type: 'NUMBER', description: 'Max items returned in chat list (10-100)' },
      { key: 'AI_TOOLS_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Enable AI tool usage in completions' },
      { key: 'CHAT_HISTORY_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Return full message history vs last N messages' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed:', { user: user.id, chats: [chat1.id, chat2.id, chat3.id] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
