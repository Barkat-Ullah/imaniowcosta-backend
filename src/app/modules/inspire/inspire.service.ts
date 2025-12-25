// inspire.service.ts
import {
  PrismaClient,
  EnumInspireStatus,
  EnumInspireType,
  Prisma,
} from '@prisma/client';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { IPaginationOptions } from '../../interface/pagination.type';
import { paginationHelper } from '../../utils/calculatePagination';

const prisma = new PrismaClient();

// Create Inspire (Manual or Scheduled)
const createInspire = async (data: any) => {
  const { text, date, type } = data;

  // Validation
  if (!text) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Text is required');
  }

  const inspire = await prisma.inspire.create({
    data: {
      text,
      date: date ? new Date(date) : null,
      type: type,
      status: date ? EnumInspireStatus.Scheduled : EnumInspireStatus.Manual,
    },
  });

  return inspire;
};

// Get All Inspire (with filters)
const getInspireListIntoDb = async (
  options: IPaginationOptions,
  filters: any,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;
  console.log(filterData.status);

  const andConditions: Prisma.InspireWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      text: { contains: searchTerm, mode: 'insensitive' },
    });
  }

  if (filterData.status) {
    andConditions.push({ status: filterData.status });
  }

  if (filterData.type) {
    andConditions.push({ type: filterData.type });
  }

  const whereConditions: Prisma.InspireWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.inspire.findMany({
    where: whereConditions,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.inspire.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

const getTodayInspire = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  let result = await prisma.inspire.findFirst({
    where: {
      status: EnumInspireStatus.Sent,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!result) {
    result = await prisma.inspire.findFirst({
      where: {
        date: { gte: today, lt: tomorrow },
        status: EnumInspireStatus.Scheduled,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return result;
};

const sendInspireManually = async (id: string) => {
  const inspire = await prisma.inspire.findUnique({ where: { id } });

  if (!inspire) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inspiration not found');
  }

  if (inspire.status === EnumInspireStatus.Sent) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already sent');
  }

  const updated = await prisma.inspire.update({
    where: { id },
    data: {
      status: EnumInspireStatus.Sent,
      updatedAt: new Date(),
    },
  });

  return updated;
};

const updateExpiredScheduled = async () => {
  const now = new Date();

  await prisma.inspire.updateMany({
    where: {
      status: EnumInspireStatus.Scheduled,
      date: { lt: now },
    },
    data: { status: EnumInspireStatus.Sent },
  });

  console.log('Expired scheduled inspirations updated to Sent');
};

// Update Inspire
const updateInspireIntoDb = async (id: string, data: any) => {
  const { text, date,  type } = data;

  return await prisma.inspire.update({
    where: { id },
    data: {
      text,
      date: date ? new Date(date) : undefined,
      type,
    },
  });
};

// Delete Inspire
const deleteInspireIntoDb = async (id: string) => {
  return await prisma.inspire.delete({ where: { id } });
};

export const inspireService = {
  createInspire,
  getInspireListIntoDb,
  sendInspireManually,
  updateExpiredScheduled,
  updateInspireIntoDb,
  deleteInspireIntoDb,
  getTodayInspire,
};
