import { Prisma, Provider } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';

// create Provider
const createProvider = async (data: Provider) => {
  const result = await prisma.provider.create({ data });
  return result;
};

// get all Provider
type IProviderFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
  status?: string;
};
const providerSearchAbleFields = ['fullName', 'email'];

const getProviderListIntoDb = async (
  options: IPaginationOptions,
  filters: IProviderFilterRequest,
  childId: string,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.ProviderWhereInput[] = [];
  andConditions.push({ childId });

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...providerSearchAbleFields.map(field => ({
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
      if (key === 'status') {
        const statuses = Array.isArray(value) ? value : [value];
        andConditions.push({
          status: { in: statuses },
        });
        return;
      }
      andConditions.push({
        [key]: value,
      });
    });
  }

  const whereConditions: Prisma.ProviderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.provider.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.provider.count({
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

// get Provider by id
const getProviderById = async (id: string) => {
  const result = await prisma.provider.findUnique({
    where: { id },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }
  return result;
};

// update Provider
const updateProviderIntoDb = async (id: string, data: any) => {
  const result = await prisma.provider.update({
    where: { id },
    data,
  });
  return result;
};

// delete Provider
const deleteProviderIntoDb = async (id: string) => {
  const result = await prisma.provider.delete({
    where: { id },
  });
  return result;
};

export const providerService = {
  createProvider,
  getProviderListIntoDb,
  getProviderById,
  updateProviderIntoDb,
  deleteProviderIntoDb,
};
