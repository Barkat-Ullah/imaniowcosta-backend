import { Prisma } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { prisma } from '../../utils/prisma';
import ApiError from '../../errors/AppError';
import httpStatus from 'http-status';
import { paginationHelper } from '../../utils/calculatePagination';
import { Request } from 'express';
import { fileUploader } from '../../utils/fileUploader';
import {
  CACHE_CONFIG,
  CacheKeyGenerator,
  CacheManager,
  withCache,
} from '../../utils/cache/cacheManager';

// Cache prefix for learning library
const CACHE_PREFIX = CACHE_CONFIG.LEARNING_LIBRARY.prefix;
const CACHE_TTL = CACHE_CONFIG.LEARNING_LIBRARY.ttl;

// create LearningLibrary
const createLearningLibrary = async (req: Request) => {
  const createdId = req.user.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;

  let uploadedFiles: {
    image?: string;
    pdf?: string;
  } = {};

  try {
    // Image
    if (files?.image?.[0]) {
      const upload = await fileUploader.uploadToCloudinaryWithType(
        files.image[0],
        'image',
      );
      uploadedFiles.image = upload.Location;
    }

    // PDF Upload
    if (files?.pdf?.[0]) {
      const upload = await fileUploader.uploadToCloudinaryWithType(
        files.pdf[0],
        'pdf',
      );
      uploadedFiles.pdf = upload.Location;
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error); // ← Log real error!
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file', error);
  }

  const addedData = { ...data, ...uploadedFiles, createdId };
  const result = await prisma.learningLibrary.create({ data: addedData });

  // Invalidate all learning library list caches
  CacheManager.invalidateByPrefix(CACHE_PREFIX);
  console.log('✅ Learning Library created - All list caches invalidated');
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

  // Generate cache key based on all parameters
  const cacheKey = CacheKeyGenerator.list(CACHE_PREFIX, {
    userId,
    page,
    limit,
    searchTerm,
    ...filterData,
  });

  // Try to get from cache
  const cached = CacheManager.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

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

  const response = {
    meta: { total, page, limit },
    data: formattedData,
  };

  // Store in cache
  CacheManager.set(cacheKey, response, CACHE_TTL);

  return response;
};

// get LearningLibrary by id
const getLearningLibraryById = async (id: string, userId: string) => {
  const cacheKey = `${CacheKeyGenerator.byId(CACHE_PREFIX, id)}:user:${userId}`;

  return withCache(
    cacheKey,
    async () => {
      const result = await prisma.learningLibrary.findUnique({
        where: { id },
      });

      if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, 'LearningLibrary not found');
      }

      // Get user's favorite articles
      const userFavorites = await prisma.favorite.findMany({
        where: { userId },
        select: { articleId: true },
      });

      const favoriteArticleIds = new Set(userFavorites.map(f => f.articleId));
      const isFavorite = favoriteArticleIds.has(id);

      return {
        ...result,
        isFavorite,
      };
    },
    CACHE_TTL,
  );
};
// update LearningLibrary
const updateLearningLibraryIntoDb = async (id: string, req: Request) => {
  const createdId = req.user.id;
  const data = req.body.data ? JSON.parse(req.body.data) : {};
  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;

  let uploadedFiles: {
    image?: string;
    pdf?: string;
  } = {};

  try {
    // Image
    if (files?.image?.[0]) {
      const upload = await fileUploader.uploadToCloudinaryWithType(
        files.image[0],
        'image',
      );
      uploadedFiles.image = upload.Location;
    }

    // PDF Upload
    if (files?.pdf?.[0]) {
      const upload = await fileUploader.uploadToCloudinaryWithType(
        files.pdf[0],
        'pdf',
      );
      uploadedFiles.pdf = upload.Location;
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file', error);
  }

  const updatedData = { ...data, ...uploadedFiles };
  const result = await prisma.learningLibrary.update({
    where: { id },
    data: updatedData,
  });

  // Invalidate specific item cache
  const itemCacheKey = CacheKeyGenerator.byId(CACHE_PREFIX, id);
  CacheManager.delete(itemCacheKey);

  // Invalidate all list caches for this section
  CacheManager.invalidateByPrefix(CACHE_PREFIX);
  console.log(`✅ Learning Library ${id} updated - Caches invalidated`);

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

  // Invalidate specific item cache
  const itemCacheKey = CacheKeyGenerator.byId(CACHE_PREFIX, id);
  CacheManager.delete(itemCacheKey);

  // Invalidate all list caches
  CacheManager.invalidateByPrefix(CACHE_PREFIX);
  console.log(`✅ Learning Library ${id} deleted - Caches invalidated`);

  return result;
};

export const learningLibraryService = {
  createLearningLibrary,
  getLearningLibraryListIntoDb,
  getLearningLibraryById,
  updateLearningLibraryIntoDb,
  deleteLearningLibraryIntoDb,
};
