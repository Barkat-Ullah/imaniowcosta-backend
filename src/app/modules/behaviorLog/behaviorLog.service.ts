import { PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/AppError';

const prisma = new PrismaClient();
interface IBehaviorLogUpdateInput {
  childId: string;
  selectedBehaviors: string[];
}

const updateBehaviorLogWithUpsert = async (data: IBehaviorLogUpdateInput, userId: string) => {
  const child = await prisma.children.findFirst({
    where: {
      id: data.childId,
      creatorId: userId,
      isDeleted: false,
    },
  });

  if (!child) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this child');
  }

  const existing = await prisma.behaviorLog.findUnique({
    where: { childId: data.childId },
  });

  let result;

  if (existing) {
    result = await prisma.behaviorLog.update({
      where: { id: existing.id },
      data: {
        selectedBehaviors: data.selectedBehaviors,
      },
    });
  } else {
    result = await prisma.behaviorLog.create({
      data: {
        childId: data.childId,
        selectedBehaviors: data.selectedBehaviors,
      },
    });
  }

  return result;
};

const getBehaviorLogByChild = async (childId: string, userId: string) => {
  const child = await prisma.children.findFirst({
    where: { id: childId, creatorId: userId, isDeleted: false },
  });

  if (!child) throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');

  const log = await prisma.behaviorLog.findUnique({
    where: { childId },
  });

  return log || { selectedBehaviors: [] };
};

export const BehaviorLogService = {
  updateBehaviorLogWithUpsert,
  getBehaviorLogByChild,
};
