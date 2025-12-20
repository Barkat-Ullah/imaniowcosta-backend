import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { childDocumentService } from './childDocument.service';

// create ChildDocument
const createChildDocument = catchAsync(async (req: Request, res: Response) => {
  const result = await childDocumentService.createChildDocument(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'ChildDocument created successfully',
    data: result,
  });
});

const getChildDocumentList = catchAsync(async (req: Request, res: Response) => {
  const result = await childDocumentService.getChildDocumentListIntoDb(
    req.params.childId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChildDocument list retrieved successfully',
    data: result,
  });
});

// get ChildDocument by id
const getChildDocumentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await childDocumentService.getChildDocumentById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChildDocument details retrieved successfully',
    data: result,
  });
});

// update ChildDocument
const updateChildDocument = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await childDocumentService.updateChildDocumentIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChildDocument updated successfully',
    data: result,
  });
});

// delete ChildDocument
const deleteChildDocument = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await childDocumentService.deleteChildDocumentIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ChildDocument deleted successfully',
    data: result,
  });
});

export const childDocumentController = {
  createChildDocument,
  getChildDocumentList,
  getChildDocumentById,
  updateChildDocument,
  deleteChildDocument,
};
