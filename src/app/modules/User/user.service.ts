import httpStatus from 'http-status';
import { Prisma, User, UserRoleEnum, UserStatus } from '@prisma/client';
import QueryBuilder from '../../builder/QueryBuilder';
import { prisma } from '../../utils/prisma';

import { Request } from 'express';
import AppError from '../../errors/AppError';
import { fileUploader } from '../../utils/fileUploader';
import { paginationHelper } from '../../utils/calculatePagination';
import { IPaginationOptions } from '../../interface/pagination.type';
import ApiError from '../../errors/AppError';

interface UserWithOptionalPassword extends Omit<User, 'password'> {
  password?: string;
}
type IUserFilterRequest = {
  searchTerm?: string;
  status?: string;
  subscription?: 'Free' | 'Paid';
};

const getAllUsersFromDB = async (
  options: IPaginationOptions,
  filters: IUserFilterRequest,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.UserWhereInput[] = [];

  andConditions.push({
    role: UserRoleEnum.USER,
    isDeleted: false,
  });

  // Search by name or email
  if (searchTerm) {
    andConditions.push({
      OR: [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { equals: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (filterData.status) {
    andConditions.push({
      status: filterData.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
    });
  }

  if (filterData.subscription) {
    if (filterData.subscription === 'Paid') {
      andConditions.push({ stripeCustomerId: { not: null } });
    } else {
      andConditions.push({ stripeCustomerId: null });
    }
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0
      ? { AND: andConditions }
      : { role: UserRoleEnum.USER };

  const users = await prisma.user.findMany({
    where: whereConditions,
    select: {
      id: true,
      fullName: true,
      email: true,
      image: true,
      status: true,
      stripeCustomerId: true,
      createdAt: true,
      _count: {
        select: {
          childrenS: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  const formattedData = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    image: user.image,
    childCount: user._count.childrenS,
    subscription: user.stripeCustomerId ? 'Paid' : 'Free',
    status: user.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
    createdAt: user.createdAt,
  }));

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: formattedData,
  };
};

const getMyProfileFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      image: true,
      role: true,
      phoneNumber: true,
      address: true,
      dob: true,
      educationLevel: true,
      employmentStatus: true,
      parentingGoal: true,
      supportSystem: true,
      relation: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      
    },
  });
  return user;
};

const getMyCareGiverFromDB = async (id: string) => {
  const careGiver = await prisma.user.findMany({
    where: {
      createdById: id,
    },
    // select: {
    //   id: true,
    //   fullName: true,
    //   email: true,
    //   image: true,
    //   role: true,
    //   phoneNumber: true,
    //   address: true,
    //   dob: true,
    //   educationLevel: true,
    //   employmentStatus: true,
    //   parentingGoal: true,
    //   supportSystem: true,
    //   relation: true,
    //   status: true,
    //   createdAt: true,
    //   updatedAt: true,
    // },
  });
  return careGiver;
};

const getMyChildrenFromDB = async (id: string) => {
  const children = await prisma.children.findMany({
    where: {
      creatorId: id,
    },
  });
  return children;
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      image: true,
      role: true,
      phoneNumber: true,
      address: true,
      dob: true,
      educationLevel: true,
      employmentStatus: true,
      parentingGoal: true,
      supportSystem: true,
      relation: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      childrenS: true,
      _count: {
        select: {
          childrenS: true,
        },
      },
    },
  });
  return user;
};

const updateUserRoleStatusIntoDB = async (id: string, role: UserRoleEnum) => {
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      role: role,
    },
  });
  return result;
};

const updateUserStatus = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { status: true, role: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const result = await prisma.user.update({
    where: { id },
    data: { status: newStatus },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      role: true,
      image: true,
    },
  });

  return result;
};

const updateUserApproval = async (userId: string) => {
  console.log(userId);
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: {
  //     id: true,
  //     fullName: true,
  //     email: true,
  //     isApproved: true,
  //   },
  // });

  // if (!user) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  // }
  // const result = await prisma.user.update({
  //   where: { id: userId },
  //   data: {
  //     isApproved: true,
  //   },
  // });
  // return result;
};

const softDeleteUserIntoDB = async (id: string) => {
  const result = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: {
      id: true,
      isDeleted: true,
    },
  });
  return result;
};
const hardDeleteUserIntoDB = async (id: string, adminId: string) => {
  // const adminUser = await prisma.user.findUnique({
  //   where: {
  //     id: adminId,
  //     role: UserRoleEnum.ADMIN,
  //   },
  // });
  // if (!adminUser) {
  //   throw new AppError(httpStatus.UNAUTHORIZED, 'You are not a admin');
  // }
  // return await prisma.$transaction(
  //   async tx => {
  //     // related tables delete
  //     await tx.goal.deleteMany({ where: { userId: id } });
  //     await tx.message.deleteMany({ where: { senderId: id } });
  //     await tx.message.deleteMany({ where: { receiverId: id } });
  //     await tx.payment.deleteMany({ where: { userId: id } });
  //     await tx.motivation.deleteMany({ where: { userId: id } });
  //     await tx.notificationUser.deleteMany({ where: { userId: id } });
  //     await tx.vision.deleteMany({ where: { userId: id } });
  //     await tx.community.deleteMany({ where: { userId: id } });
  //     await tx.communityMembers.deleteMany({ where: { userId: id } });
  //     await tx.follow.deleteMany({
  //       where: {
  //         OR: [{ followerId: id }, { followingId: id }],
  //       },
  //     });
  //     const deletedUser = await tx.user.delete({
  //       where: { id },
  //       select: { id: true, email: true },
  //     });
  //     return deletedUser;
  //   },
  //   {
  //     timeout: 20000,
  //     maxWait: 5000,
  //   },
  // );
};

const updateUserIntoDb = async (req: Request, id: string) => {
  // Step 1️⃣: Check if user exists
  const userInfo = await prisma.user.findUnique({
    where: { id },
  });

  if (!userInfo) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found with id: ' + id);
  }

  // Step 2️⃣: Parse incoming data
  const { fullName, describe, city, address, phoneNumber } = JSON.parse(
    req.body.data,
  );

  // Step 3️⃣: Handle file upload (optional)
  const file = req.file as Express.Multer.File | undefined;

  let imageUrl: string | null = userInfo.image;

  if (file) {
    const location = await fileUploader.uploadToDigitalOcean(file);
    imageUrl = location.Location;
  }

  // Step 4️⃣: Update user in DB
  const result = await prisma.user.update({
    where: { id },
    data: {
      fullName,
      // businessType,
      describe,
      city,
      address,
      phoneNumber,
      image: imageUrl,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      image: true,
      role: true,
      // businessType: true,
      describe: true,
      city: true,
      address: true,
      status: true,
    },
  });

  if (!result) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update user image',
    );
  }

  return result;
};

const updateMyProfileIntoDB = async (id: string, req: Request) => {
  const payload = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const updatedData = { ...payload, image };

  // Always update (with or without file)
  const result = await prisma.user.update({
    where: { id },
    data: updatedData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      image: true,
      role: true,
      status: true,
      address: true,
    },
  });

  return result;
};

export const UserServices = {
  getAllUsersFromDB,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateUserRoleStatusIntoDB,
  updateUserStatus,
  updateUserApproval,
  softDeleteUserIntoDB,
  hardDeleteUserIntoDB,
  updateUserIntoDb,
  updateMyProfileIntoDB,
  getMyCareGiverFromDB,
  getMyChildrenFromDB,
};
