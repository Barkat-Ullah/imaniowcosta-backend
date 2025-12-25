import { PrismaClient, UserRoleEnum } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/AppError';
const prisma = new PrismaClient();

const createMultipleEntries = async (
  payload: {
    childId: string;
    selectedBehaviors: { behavior: string; date: string }[];
  },
  userId: string,
) => {
  const { childId, selectedBehaviors } = payload;

  // === Access Control ===
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  let accessId = userId;
  if (user?.role === UserRoleEnum.CARE_GIVER) {
    const caregiver = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdBy: { select: { id: true } } },
    });
    if (!caregiver?.createdBy) {
      throw new ApiError(httpStatus.FORBIDDEN, 'No access to any children');
    }
    accessId = caregiver.createdBy.id;
  }

  const child = await prisma.children.findFirst({
    where: { id: childId, creatorId: accessId, isDeleted: false },
  });

  if (!child) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have access to this child',
    );
  }
  // === End Access Control ===

  // Prepare data for bulk create
  const entriesToCreate = selectedBehaviors.map(item => ({
    childId,
    behavior: item.behavior.trim(),
    logDate: new Date(item.date),
  }));

  const createdEntries = await prisma.behaviorLog.createMany({
    data: entriesToCreate,
  });

  return {
    count: createdEntries.count,
    message: `${createdEntries.count} behavior entries logged`,
  };
};

const getBehaviorLogByChild = async (childId: string, userId: string) => {
  const startDay = new Date();
  const endDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  endDay.setHours(23, 59, 59, 999);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });
  let accessId;
  if (user?.role === UserRoleEnum.CARE_GIVER) {
    const managedParents = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdBy: {
          select: { id: true },
        },
      },
    });

    if (!managedParents?.createdBy) {
      throw new ApiError(httpStatus.FORBIDDEN, 'No access to any children');
    }
    accessId = managedParents.createdBy.id;
  } else {
    accessId = userId;
  }
  const child = await prisma.children.findFirst({
    where: { id: childId, creatorId: accessId, isDeleted: false },
  });

  if (!child) throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');

  const log = await prisma.behaviorLog.findMany({
    where: {
      childId,
      logDate: {
        gte: startDay,
        lte: endDay,
      },
    },
    select: {
      id: true,
      childId: true,
      behavior: true,
      logDate: true,
    },
    orderBy: { logDate: 'desc' },
  });

  return log;
};

const getPottyProgress = async (
  childId: string,
  start: Date,
  end: Date,
) => {
  const entries = await prisma.behaviorLog.findMany({
    where: {
      childId,
      logDate: { gte: start, lte: end },
      behavior: {
        in: ['Potty Attempt', 'Potty Success'],
      },
    },
  });

  const attempts = entries.filter(e => e.behavior === 'Potty Attempt').length;
  const successes = entries.filter(e => e.behavior === 'Potty Success').length;
  const totalAttempts = attempts + successes;

  const percentage = `${totalAttempts > 0 ? Math.round((successes / totalAttempts) * 100) : 0} %`;

  return {
    percentage,
    successes,
    attempts: totalAttempts,
  };
};

const getNewFoodsThisWeek = async (
  childId: string,
  start: Date,
  end: Date,
) => {
  const entries = await prisma.behaviorLog.findMany({
    where: {
      childId,
      logDate: { gte: start, lte: end },
      behavior: { startsWith: 'Tried ' }, // e.g. "Tried Mango"
    },
  });

  const foods = new Set<string>();
  entries.forEach(e => {
    const food = e.behavior.replace('Tried ', '').trim();
    if (food) foods.add(food);
  });

  const foodList = entries.map(e => ({
    food: e.behavior.replace('Tried ', ''),
    day: e.logDate.toLocaleDateString('en-US', { weekday: 'long' }),
  }));

  return {
    count: foods.size,
    foods: Array.from(foods),
    list: foodList,
  };
};

const getPositiveMoments = async (
  childId: string,
  start: Date,
  end: Date,
) => {
  const positiveBehaviors = [
    'Comfortable during care',
    'Cooperated with routine',
    'Indicated need for change',
  ];

  const entries = await prisma.behaviorLog.findMany({
    where: {
      childId,
      logDate: { gte: start, lte: end },
      behavior: { in: positiveBehaviors },
    },
  });

  // Count each type
  const counts: Record<string, number> = {};
  entries.forEach(e => {
    counts[e.behavior] = (counts[e.behavior] || 0) + 1;
  });

  const totalPositive = entries.length;

  return {
    total: totalPositive,
    breakdown: counts,
  };
};

export const BehaviorLogService = {
  createMultipleEntries,
  getBehaviorLogByChild,
  getPottyProgress,
  getPositiveMoments,
  getNewFoodsThisWeek,
};
