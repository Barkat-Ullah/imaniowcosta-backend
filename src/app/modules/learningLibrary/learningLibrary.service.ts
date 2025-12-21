import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';
// import { cache, CACHE_KEYS, invalidateAllPostsCaches } from './cache.constant';

// create LearningLibrary
const createLearningLibrary = async (req: Request) => {
  const createdId = req.user.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const addedData = { ...data, image, createdId };
  const result = await prisma.learningLibrary.create({ data: addedData });
  // invalidateAllPostsCaches();
  return result;
};

// get all LearningLibrary
type ILearningLibraryFilterRequest = {
  searchTerm?: string;
  id?: string;
  createdAt?: string;
  content?: string;
};
const learningLibrarySearchAbleFields = ['title'];

const getLearningLibraryListIntoDb = async (
  userId: string,
  options: IPaginationOptions,
  filters: ILearningLibraryFilterRequest,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  //  const cached = cache.get(CACHE_KEYS);
  //  if (cached) {
  //    console.log(`✅ Cache HIT: getAllPost (${cacheKey})`);
  //    return cached;
  //  }

  //  console.log(
  //    `❌ Cache MISS: getAllPost (${cacheKey}) - Fetching from database`,
  //  );

  const andConditions: Prisma.LearningLibraryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...learningLibrarySearchAbleFields.map(field => ({
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
      if (key === 'content') {
        const contents = Array.isArray(value) ? value : [value];
        andConditions.push({
          content: { in: contents },
        });
        return;
      }
      andConditions.push({
        [key]: value,
      });
    });
  }

  const whereConditions: Prisma.LearningLibraryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const userFavorites = await prisma.favorite.findMany({
    where: {
      userId,
    },
    select: {
      articleId: true,
    },
  });

  const favoriteArticleIds = new Set(userFavorites.map(f => f.articleId));

  const result = await prisma.learningLibrary.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.learningLibrary.count({
    where: whereConditions,
  });

  const formattedData = result.map(article => ({
    ...article,
    isFavorite: favoriteArticleIds.has(article.id),
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

// get LearningLibrary by id
const getLearningLibraryById = async (id: string) => {
  //  const cacheKey = CACHE_KEYS.POST_BY_ID(id);

  //  const cached = cache.get(cacheKey);
  //  if (cached) {
  //    console.log(`✅ Cache HIT: Post ${id}`);
  //    return cached;
  //  }

  //  console.log(`❌ Cache MISS: Post ${id} - Fetching from database`);

  const result = await prisma.learningLibrary.findUnique({
    where: { id },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'LearningLibrary not found');
  }
  // Invalidate specific post cache only
  // cache.del(CACHE_KEYS.POST_BY_ID(id));
  // console.log(`🗑️  Cache invalidated: Post ${id}`);
  return result;
};

// update LearningLibrary
const updateLearningLibraryIntoDb = async (id: string, req: Request) => {
  const createdId = req.user.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;
  let image;

  if (file) {
    image = (await fileUploader.uploadToCloudinary(file)).Location;
  }

  const addedData = { ...data, image, createdId };
  const result = await prisma.learningLibrary.update({
    where: { id },
    data: addedData,
  });

  // Invalidate specific post cache only
  // cache.del(CACHE_KEYS.POST_BY_ID(id));
  // console.log(`🗑️  Cache invalidated: Post ${id}`);
  return result;
};

const deleteLearningLibraryIntoDb = async (id: string, userId: string) => {
  const learningLibrary = await prisma.learningLibrary.findUnique({
    where: { id },
    select: { createdId: true },
  });

  if (!learningLibrary) {
    throw new ApiError(httpStatus.NOT_FOUND, 'LearningLibrary not found');
  }

  if (learningLibrary.createdId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized');
  }

  const result = await prisma.learningLibrary.delete({
    where: { id },
  });

  // // Invalidate specific post cache
  // cache.del(CACHE_KEYS.POST_BY_ID(id));

  // // Invalidate ALL posts list caches
  // invalidateAllPostsCaches();

  return result;
};

export const learningLibraryService = {
  createLearningLibrary,
  getLearningLibraryListIntoDb,
  getLearningLibraryById,
  updateLearningLibraryIntoDb,
  deleteLearningLibraryIntoDb,
};
