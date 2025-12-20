// children.service.ts
import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';

const createChildren = async (req: Request) => {
  const creatorId = req.user.id;
  const payload = req.body;

  const result = await prisma.children.create({
    data: {
      ...payload,
      creatorId,
    },
    include: {
      user: {
        select: { id: true, fullName: true, image: true, role: true },
      },
    },
  });

  return result;
};

type IChildrenFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
};

const getChildrenListIntoDb = async (
  options: IPaginationOptions,
  filters: IChildrenFilterRequest,
  userId: string,
  userRole: string,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.ChildrenWhereInput[] = [];

  if (userRole === 'CARE_GIVER') {
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

    andConditions.push({
      creatorId: managedParents.createdBy.id,
    });
  } else {
    andConditions.push({ creatorId: userId });
  }

  // Search by child name
  if (searchTerm) {
    andConditions.push({
      fullName: { contains: searchTerm, mode: 'insensitive' },
    });
  }

  // Other filters
  if (Object.keys(filterData).length > 0) {
    Object.keys(filterData).forEach(key => {
      const value = (filterData as any)[key];
      if (!value) return;

      if (key === 'createdAt') {
        const start = new Date(value as string);
        start.setHours(0, 0, 0, 0);
        const end = new Date(value as string);
        end.setHours(23, 59, 59, 999);

        andConditions.push({
          createdAt: { gte: start, lte: end },
        });
        return;
      }

      andConditions.push({ [key]: value });
    });
  }

  const whereConditions: Prisma.ChildrenWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.children.findMany({
    where: { ...whereConditions, isDeleted: false },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          image: true,
          role: true,
          relation: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.children.count({
    where: { ...whereConditions, isDeleted: false },
  });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

const getChildrenById = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  let parentId: string;

  if (userRole === 'CARE_GIVER') {
    const caregiver = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdBy: { select: { id: true } } },
    });

    if (!caregiver?.createdBy) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    parentId = caregiver.createdBy.id;
  } else {
    parentId = userId;
  }

  const result = await prisma.children.findUnique({
    where: { id, creatorId: parentId, isDeleted: false },
    include: {
      // childDocument: true,
      // providers: true,
      // healthCareNotes: true,
      // preferenceNotes: true,
      user: {
        select: {
          id: true,
          fullName: true,
          image: true,
          relation: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Child not found or access denied',
    );
  }

  return result;
};

const updateChildrenIntoDb = async (
  id: string,
  data: any,
  file: Express.Multer.File | undefined,
  userId: string,
  userRole: string,
) => {
  let parentId: string;

  if (userRole === 'CARE_GIVER') {
    const caregiver = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdBy: { select: { id: true } } },
    });
    if (!caregiver?.createdBy)
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    parentId = caregiver.createdBy.id;
  } else {
    parentId = userId;
  }

  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const updatedData = { ...data, image };

  const result = await prisma.children.update({
    where: { id, creatorId: parentId },
    data: updatedData,
  });

  return result;
};

const deleteChildrenIntoDb = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  let parentId: string;

  if (userRole === 'CARE_GIVER') {
    const caregiver = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdBy: { select: { id: true } } },
    });
    if (!caregiver?.createdBy)
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    parentId = caregiver.createdBy.id;
  } else {
    parentId = userId;
  }

  // Soft delete
  const result = await prisma.children.update({
    where: { id, creatorId: parentId },
    data: { isDeleted: true },
  });

  return result;
};

export const childrenService = {
  createChildren,
  getChildrenListIntoDb,
  getChildrenById,
  updateChildrenIntoDb,
  deleteChildrenIntoDb,
};
