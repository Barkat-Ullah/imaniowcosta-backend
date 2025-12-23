import { PrismaClient, UserRoleEnum } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/AppError';

const prisma = new PrismaClient();
interface IBehaviorLogUpdateInput {
  childId: string;
  selectedBehaviors: string[];
}

const updateBehaviorLogWithUpsert = async (
  data: IBehaviorLogUpdateInput,
  userId: string,
) => {
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
    where: {
      id: data.childId,
      creatorId: accessId,
      isDeleted: false,
    },
  });

  if (!child) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have access to this child',
    );
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

  const log = await prisma.behaviorLog.findUnique({
    where: { childId },
  });

  return log || { selectedBehaviors: [] };
};

export const BehaviorLogService = {
  updateBehaviorLogWithUpsert,
  getBehaviorLogByChild,
};
