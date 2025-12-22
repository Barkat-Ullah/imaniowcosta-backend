import { EventStatus, Prisma, UserRoleEnum } from '@prisma/client';
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

  let finalChildIds: string[] = [];

  // 1. Determine which children to attach to the event
  if (payload.isForAllChild) {
    const myChildren = await prisma.children.findMany({
      where: {
        creatorId: accessId,
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

  const existingChildren = await prisma.children.findMany({
    where: {
      id: { in: finalChildIds },
      isDeleted: false,
      creatorId: accessId,
    },
    select: { id: true },
  });

  const existingIds = existingChildren.map(c => c.id);
  const invalidIds = finalChildIds.filter(id => !existingIds.includes(id));

  if (invalidIds.length > 0) {
    throw new ApiError(
      404,
      `Invalid child IDs: ${invalidIds.join(', ')}. These children do not exist or belong to another user.`,
    );
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
      userId: accessId,
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

const getEventListForAllChildOrSingleChildByDateIntoDb = async (
  options: IPaginationOptions,
  filters: {
    date?: string;
    childId?: string;
    searchTerm?: string;
    status?: string;
  },
  userId: string,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { date, childId, searchTerm, ...filterData } = filters;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: {
      role: true,
    },
  });

  const andConditions: Prisma.EventWhereInput[] = [];

  if (user?.role === UserRoleEnum.CARE_GIVER) {
    const managedParents = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
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
      userId: managedParents.createdBy.id,
    });
  } else {
    andConditions.push({ userId: userId });
  }

  andConditions.push({
    isDeleted: false,
  });

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    andConditions.push({
      eventDate: {
        gte: start,
        lte: end,
      },
    });
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    andConditions.push({
      eventDate: {
        gte: today,
        lte: endOfDay,
      },
    });
  }

  if (childId) {
    andConditions.push({
      OR: [{ isForAllChild: true }, { childIds: { has: childId } }],
    });
  }

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
    orderBy: { eventDate: 'asc' },
    include: {
      children: {
        select: { id: true, fullName: true, image: true },
      },
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
const updateEventIntoDb = async (req: Request) => {
  const id = req.params.id;
  const payload = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const updateData: any = { ...payload };

  if (payload.eventDate) {
    updateData.eventDate = new Date(payload.eventDate);
  }

  if (image) {
    updateData.image = image;
  }

  if (payload.repeatEndDate) {
    updateData.repeatEndDate = new Date(payload.repeatEndDate);
  }

  const result = await prisma.event.update({
    where: { id },
    data: updateData,
  });

  return result;
};

const updateEventStatus = async (req: Request) => {
  const id = req.params.id;
  const result = await prisma.event.update({
    where: {
      id,
    },
    data: {
      status: EventStatus.Completed,
    },
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
  getEventListForAllChildOrSingleChildByDateIntoDb,
  getEventById,
  updateEventIntoDb,
  deleteEventIntoDb,
  updateEventStatus,
};
