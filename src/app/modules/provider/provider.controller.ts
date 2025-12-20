import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { providerService } from './provider.service';

// create Provider
const createProvider = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await providerService.createProvider(data);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Provider created successfully',
    data: result,
  });
});

// get all Provider
const providerFilterableFields = ['searchTerm', 'id', 'createdAt', 'status'];
const getProviderList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, providerFilterableFields);
  const result = await providerService.getProviderListIntoDb(
    options,
    filters,
    req.params.childId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider list retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// get Provider by id
const getProviderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await providerService.getProviderById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider details retrieved successfully',
    data: result,
  });
});

// update Provider
const updateProvider = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await providerService.updateProviderIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider updated successfully',
    data: result,
  });
});

// delete Provider
const deleteProvider = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await providerService.deleteProviderIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider deleted successfully',
    data: result,
  });
});

export const providerController = {
  createProvider,
  getProviderList,
  getProviderById,
  updateProvider,
  deleteProvider,
};
