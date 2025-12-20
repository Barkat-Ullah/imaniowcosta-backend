import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { preferenceSensoryNoteService } from './preferenceSensoryNote.service';

// create PreferenceSensoryNote
const createPreferenceSensoryNote = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await preferenceSensoryNoteService.createPreferenceSensoryNote(req);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'PreferenceSensoryNote created successfully',
      data: result,
    });
  },
);

// get all PreferenceSensoryNote
const preferenceSensoryNoteFilterableFields = ['searchTerm', 'id', 'createdAt'];
const getPreferenceSensoryNoteList = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const filters = pick(req.query, preferenceSensoryNoteFilterableFields);
    const result =
      await preferenceSensoryNoteService.getPreferenceSensoryNoteListIntoDb(
        options,
        filters,
        req.params.childId,
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PreferenceSensoryNote list retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

// get PreferenceSensoryNote by id
const getPreferenceSensoryNoteById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await preferenceSensoryNoteService.getPreferenceSensoryNoteById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PreferenceSensoryNote details retrieved successfully',
      data: result,
    });
  },
);

// update PreferenceSensoryNote
const updatePreferenceSensoryNote = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await preferenceSensoryNoteService.updatePreferenceSensoryNoteIntoDb(req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PreferenceSensoryNote updated successfully',
      data: result,
    });
  },
);

// delete PreferenceSensoryNote
const deletePreferenceSensoryNote = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await preferenceSensoryNoteService.deletePreferenceSensoryNoteIntoDb(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PreferenceSensoryNote deleted successfully',
      data: result,
    });
  },
);

export const preferenceSensoryNoteController = {
  createPreferenceSensoryNote,
  getPreferenceSensoryNoteList,
  getPreferenceSensoryNoteById,
  updatePreferenceSensoryNote,
  deletePreferenceSensoryNote,
};
