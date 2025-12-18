import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { childrenService } from './children.service';

// create Children
const createChildren = catchAsync(async (req: Request, res: Response) => {
  const result = await childrenService.createChildren(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Children created successfully',
    data: result,
  });
});

// get all Children
const childrenFilterableFields = ['searchTerm', 'id', 'createdAt'];
const getChildrenList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, childrenFilterableFields);
  const creatorId = req.user.id;
  const userRole = req.user.role;
  const result = await childrenService.getChildrenListIntoDb(
    options,
    filters,
    creatorId,
    userRole,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Children list retrieved successfully',
    data: result,
  });
});

// get Children by id
const getChildrenById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await childrenService.getChildrenById(id, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Children details retrieved successfully',
    data: result,
  });
});

// update Children
const updateChildren = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
  const image = req.file
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await childrenService.updateChildrenIntoDb(
    id,
    payload,
    image ,
    userId,
    userRole,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Children updated successfully',
    data: result,
  });
});

// delete Children
const deleteChildren = catchAsync(async (req: Request, res: Response) => {
const { id } = req.params;
const userId = req.user.id;
const userRole = req.user.role;

const result = await childrenService.deleteChildrenIntoDb(id, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Children deleted successfully',
    data: result,
  });
});

export const childrenController = {
  createChildren,
  getChildrenList,
  getChildrenById,
  updateChildren,
  deleteChildren,
};
