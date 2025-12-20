import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { healthCareNoteService } from './healthCareNote.service';

// create HealthCareNote
const createHealthCareNote = catchAsync(async (req: Request, res: Response) => {
  const result = await healthCareNoteService.createHealthCareNote(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'HealthCareNote created successfully',
    data: result,
  });
});

// get all HealthCareNote
const healthCareNoteFilterableFields = ['searchTerm', 'id', 'createdAt'];
const getHealthCareNoteList = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const filters = pick(req.query, healthCareNoteFilterableFields);
    const result = await healthCareNoteService.getHealthCareNoteListIntoDb(
      options,
      filters,
      req.params.childId,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'HealthCareNote list retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

// get HealthCareNote by id
const getHealthCareNoteById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await healthCareNoteService.getHealthCareNoteById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'HealthCareNote details retrieved successfully',
      data: result,
    });
  },
);

// update HealthCareNote
const updateHealthCareNote = catchAsync(async (req: Request, res: Response) => {

  const result = await healthCareNoteService.updateHealthCareNoteIntoDb(
   req
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HealthCareNote updated successfully',
    data: result,
  });
});

// delete HealthCareNote
const deleteHealthCareNote = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await healthCareNoteService.deleteHealthCareNoteIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'HealthCareNote deleted successfully',
    data: result,
  });
});

export const healthCareNoteController = {
  createHealthCareNote,
  getHealthCareNoteList,
  getHealthCareNoteById,
  updateHealthCareNote,
  deleteHealthCareNote,
};
