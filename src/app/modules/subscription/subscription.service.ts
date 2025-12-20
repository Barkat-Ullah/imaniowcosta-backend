import { Prisma } from "@prisma/client";
import { IPaginationOptions } from "../../interface/pagination.type";
import { prisma } from "../../utils/prisma";
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from "../../utils/calculatePagination";


// create Subscription
 const createSubscription = async (data: any) => {
  const result = await prisma.subscription.create({ data });
  return result;
};

// get all Subscription
type ISubscriptionFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
}
const subscriptionSearchAbleFields = ['fullName', 'email', 'userName'];

const getSubscriptionListIntoDb = async (options: IPaginationOptions, filters: ISubscriptionFilterRequest) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.SubscriptionWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
      ...subscriptionSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    ],
    });
  }

  if (Object.keys(filterData).length) {
    Object.keys(filterData).forEach((key) => {
      const value = (filterData as any)[key];
      if (value === "" || value === null || value === undefined) return;
      if (key === "createdAt" && value) {
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
      if (key.includes(".")) {
        const [relation, field] = key.split(".");
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

  const whereConditions: Prisma.SubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.subscription.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: "asc",
    }
  });

  const total = await prisma.subscription.count({
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

// get Subscription by id
const getSubscriptionById = async (id: string) => {
  const result = await prisma.subscription.findUnique({
   where: { id } 
   });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  return result;
};

// update Subscription
const updateSubscriptionIntoDb = async (id: string, data: any) => {
  const result = await prisma.subscription.update({
  where: { id }, data });
  return result;
};

// delete Subscription
const deleteSubscriptionIntoDb = async (id: string) => {
  const result = await prisma.subscription.update({
    where: { id },
    data: { isDeleted: true },
  });
  return result;
};

export const subscriptionService = {
  createSubscription,
  getSubscriptionListIntoDb,
  getSubscriptionById,
  updateSubscriptionIntoDb,
  deleteSubscriptionIntoDb,
};