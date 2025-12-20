import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { inspireService } from './inspire.service';

// create Inspire
const createInspire = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await inspireService.createInspire(data);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Inspire created successfully',
    data: result,
  });
});

// get all Inspire
const inspireFilterableFields = [
  'searchTerm',
  'id',
  'createdAt',
  'type',
  'status',
];
const getInspireList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, inspireFilterableFields);
  const result = await inspireService.getInspireListIntoDb(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Inspire list retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getTodayInspireDate = catchAsync(async (req: Request, res: Response) => {
  const result = await inspireService.getTodayInspire();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result
      ? "Today's inspiration retrieved"
      : 'No inspiration for today',
    data: result,
  });
});

// get Inspire by id
const getInspireById = catchAsync(async (req: Request, res: Response) => {
  // const {id} = req.params;
  // const result = await inspireService.getInspireById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Inspire details retrieved successfully',
    data: null,
  });
});

const sendInspireManually = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await inspireService.sendInspireManually(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Inspiration sent manually',
    data: result,
  });
});

// update Inspire
const updateInspire = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await inspireService.updateInspireIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Inspire updated successfully',
    data: result,
  });
});

// delete Inspire
const deleteInspire = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await inspireService.deleteInspireIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Inspire deleted successfully',
    data: result,
  });
});

export const inspireController = {
  createInspire,
  getInspireList,
  getInspireById,
  updateInspire,
  deleteInspire,
  sendInspireManually,
  getTodayInspireDate,
};
