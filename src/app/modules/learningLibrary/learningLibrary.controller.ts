import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { learningLibraryService } from './learningLibrary.service';

// create LearningLibrary
const createLearningLibrary = catchAsync(
  async (req: Request, res: Response) => {
    const result = await learningLibraryService.createLearningLibrary(req);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'LearningLibrary created successfully',
      data: result,
    });
  },
);

// get all LearningLibrary
const learningLibraryFilterableFields = [
  'searchTerm',
  'id',
  'createdAt',
  'content',
];
const getLearningLibraryList = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const filters = pick(req.query, learningLibraryFilterableFields);
    const result = await learningLibraryService.getLearningLibraryListIntoDb(
      userId,
      options,
      filters,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'LearningLibrary list retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

// get LearningLibrary by id
const getLearningLibraryById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await learningLibraryService.getLearningLibraryById(
      id,
      req.user.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'LearningLibrary details retrieved successfully',
      data: result,
    });
  },
);

// update LearningLibrary
const updateLearningLibrary = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await learningLibraryService.updateLearningLibraryIntoDb(
      id,
      req,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'LearningLibrary updated successfully',
      data: result,
    });
  },
);

// delete LearningLibrary
const deleteLearningLibrary = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await learningLibraryService.deleteLearningLibraryIntoDb(
      id,
      req.user.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'LearningLibrary deleted successfully',
      data: result,
    });
  },
);

export const learningLibraryController = {
  createLearningLibrary,
  getLearningLibraryList,
  getLearningLibraryById,
  updateLearningLibrary,
  deleteLearningLibrary,
};
