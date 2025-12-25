// src/utils/seedSubscriptions.ts
import { DurationType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptions() {
  const plans = [
    {
      title: 'Free Plan',
      description: 'Get started with core features and daily logs.',
      originalPrice: 0,
      discountedPrice: null,
      finalPrice: 0,
      childCreation: 3,
      careGiverCreation: 1,
      duration: DurationType.Freely,
      isDeleted: false,
    },
    {
      title: 'Monthly Plan',
      description:
        'Unlock full insights, voice-to-text notes, and shared reports.',
      originalPrice: 8.99,
      discountedPrice: null,
      finalPrice: 8.99,
      childCreation: 10,
      careGiverCreation: 5,
      duration: DurationType.Monthly,
      isDeleted: false,
    },
    {
      title: 'Annual Plan',
      description: 'Enjoy all Premium features year-round and save over 25%.',
      originalPrice: 107.88,
      discountedPrice: 79.99,
      finalPrice: 79.99,
      childCreation: 20,
      careGiverCreation: 10,
      duration: DurationType.Yearly,
      isDeleted: false,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscription.findFirst({
      where: { duration: plan.duration },
    });

    if (!existing) {
      await prisma.subscription.create({
        data: plan,
      });
      console.log(`Subscription "${plan.title}" created successfully`);
    } else {
      console.log(`Subscription "${plan.title}" already exists`);
    }
  }
}
export default seedSubscriptions;
