import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';

// create Event
const createEvent = async (req: Request) => {
  const userId = req.user.id;
  const payload = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  let finalChildIds: string[] = [];

  // 1. Determine which children to attach to the event
  if (payload.isForAllChild) {
    const myChildren = await prisma.children.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (myChildren.length === 0) {
      throw new ApiError(
        404,
        'No children found for this user to assign to event.',
      );
    }

    finalChildIds = myChildren.map(child => child.id);
  } else {
    if (!payload.selectedChildId) {
      throw new ApiError(
        400,
        'selectedChildId is required when isForAllChild is false',
      );
    }
    finalChildIds = [payload.selectedChildId];
  }

  // 2. Create the Event and establish relations
  const result = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      eventDate: new Date(payload.eventDate),
      startTime: payload.startTime,
      endTime: payload.endTime,
      duration: payload.duration ? Number(payload.duration) : null,
      category: payload.category,
      location: payload.location,
      notes: payload.notes,
      image,
      repeatType: payload.repeatType || 'None',
      attachmentUrl: payload.attachmentUrl,
      repeatEndDate: payload.repeatEndDate
        ? new Date(payload.repeatEndDate)
        : null,
      isForAllChild: payload.isForAllChild || false,

      // Foreign Key references
      userId: userId,
      providerId: payload.providerId || null,

      // Many-to-Many Connection
      childIds: finalChildIds,
      children: {
        connect: finalChildIds.map(id => ({ id })),
      },
    },
    include: {
      children: {
        select: {
          id: true,
          fullName: true,
          image: true,
        },
      },
    },
  });

  return result;
};

// get all Event
type IEventFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
  status?: string;
};
const eventSearchAbleFields = ['title'];

const getEventListIntoDb = async (
  options: IPaginationOptions,
  filters: IEventFilterRequest,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.EventWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...eventSearchAbleFields.map(field => ({
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

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.event.count({
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

// get Event by id
const getEventById = async (id: string) => {
  const result = await prisma.event.findUnique({
    where: { id, isDeleted: false },
    include: {
      children: {
        select: {
          id: true,
          fullName: true,
          image: true,
          dateOfBirth: true,
        },
      },
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  return result;
};

// update Event
const updateEventIntoDb = async (id: string, data: any) => {
  const result = await prisma.event.update({
    where: { id },
    data,
  });
  return result;
};

// delete Event
const deleteEventIntoDb = async (id: string) => {
  const result = await prisma.event.update({
    where: { id },
    data: { isDeleted: true },
  });
  return result;
};

export const eventService = {
  createEvent,
  getEventListIntoDb,
  getEventById,
  updateEventIntoDb,
  deleteEventIntoDb,
};
