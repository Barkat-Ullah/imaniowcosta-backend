import { ActivityEnum, Prisma, UserRoleEnum } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';

// create Activity
const createActivity = async (req: Request) => {
  const userId = req.user.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

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

  const addedData = { ...data, image, userId: accessId };
  const result = await prisma.activity.create({ data: addedData });
  return result;
};

// get all Activity
type IActivityFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
  activity?: string;
};
const activitySearchAbleFields = ['title'];

const getActivityListIntoDb = async (
  options: IPaginationOptions,
  filters: IActivityFilterRequest,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.ActivityWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...activitySearchAbleFields.map(field => ({
          [field]: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        })),
      ],
    });
  }

  if (Object.keys(filterData).length) {
    Object.keys(filterData).forEach(key => {
      const value = (filterData as any)[key];
      if (value === '' || value === null || value === undefined) return;
      if (key === 'createdAt' && value) {
        const start = new Date(value);
        start.setHours(0, 0, 0, 0);
        const end = new Date(value);
        end.setHours(23, 59, 59, 999);
        andConditions.push({
          createdAt: {
            gte: start.toISOString(),
            lte: end.toISOString(),
          },
        });
        return;
      }
      if (key.includes('.')) {
        const [relation, field] = key.split('.');
        andConditions.push({
          [relation]: {
            some: { [field]: value },
          },
        });
        return;
      }
      if (key === 'activity') {
        const activities = Array.isArray(value) ? value : [value];
        andConditions.push({
          activity: { in: activities },
        });
        return;
      }
      andConditions.push({
        [key]: value,
      });
    });
  }

  const whereConditions: Prisma.ActivityWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.activity.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: 'asc',
    },
  });

  const total = await prisma.activity.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get Activity by id
const getMyActivityList = async (userId: string) => {
  if (!userId) {
    throw new ApiError(404, 'User not found');
  }
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
  const result = await prisma.activity.findMany({
    where: { userId: accessId },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activity not found');
  }
  return result;
};

const getActivityById = async (id: string) => {
  const result = await prisma.activity.findUnique({
    where: { id },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activity not found');
  }
  return result;
};

const markActivityCompleted = async (activityId: string, userId: string) => {
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.userCompletedActivity.findFirst({
    where: {
      activityId,
      completedAt: { gte: today },
    },
  });

  if (existing) {
    throw new Error('Activity already marked as completed today');
  }

  return prisma.userCompletedActivity.create({
    data: {
      activityId,
      userId: accessId,
      completedAt: new Date(),
    },
    include: {
      activity: true,
    },
  });
};

// update Activity
const updateActivityIntoDb = async (id: string, data: any) => {
  const result = await prisma.activity.update({
    where: { id },
    data,
  });
  return result;
};

// delete Activity
const deleteActivityIntoDb = async (id: string) => {
  const result = await prisma.activity.delete({
    where: { id },
  });
  return result;
};



export const activityService = {
  createActivity,
  getActivityListIntoDb,
  getActivityById,
  updateActivityIntoDb,
  markActivityCompleted,
  deleteActivityIntoDb,
  getMyActivityList,
};
