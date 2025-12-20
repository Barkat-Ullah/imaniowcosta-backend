import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';

// create HealthCareNote
const createHealthCareNote = async (req: Request) => {
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const addedData = { ...data, image };
  const result = await prisma.healthCareNote.create({ data: addedData });
  return result;
};

// get all HealthCareNote
type IHealthCareNoteFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
};
const healthCareNoteSearchAbleFields = ['title'];

const getHealthCareNoteListIntoDb = async (
  options: IPaginationOptions,
  filters: IHealthCareNoteFilterRequest,
  childId: string,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.HealthCareNoteWhereInput[] = [];
  andConditions.push({ childId });

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...healthCareNoteSearchAbleFields.map(field => ({
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
      // if (key === "status") {
      //   const statuses = Array.isArray(value) ? value : [value];
      //   andConditions.push({
      //     status: { in: statuses },
      //   });
      //   return;
      // }
      andConditions.push({
        [key]: value,
      });
    });
  }

  const whereConditions: Prisma.HealthCareNoteWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.healthCareNote.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.healthCareNote.count({
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

// get HealthCareNote by id
const getHealthCareNoteById = async (id: string) => {
  const result = await prisma.healthCareNote.findUnique({
    where: { id },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'HealthCareNote not found');
  }
  return result;
};

// update HealthCareNote
const updateHealthCareNoteIntoDb = async (req: Request) => {
  const id = req.params.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const addedData = { ...data, image };
  const result = await prisma.healthCareNote.update({
    where: { id },
    data: addedData,
  });
  return result;
};

// delete HealthCareNote
const deleteHealthCareNoteIntoDb = async (id: string) => {
  const result = await prisma.healthCareNote.delete({
    where: { id },
  });
  return result;
};

export const healthCareNoteService = {
  createHealthCareNote,
  getHealthCareNoteListIntoDb,
  getHealthCareNoteById,
  updateHealthCareNoteIntoDb,
  deleteHealthCareNoteIntoDb,
};
