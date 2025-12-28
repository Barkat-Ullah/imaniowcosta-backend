import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { activityService } from './activity.service';

// create Activity
const createActivity = catchAsync(async (req: Request, res: Response) => {
  const result = await activityService.createActivity(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Activity created successfully',
    data: result,
  });
});

// get all Activity
const activityFilterableFields = ['searchTerm', 'id', 'createdAt', 'activity'];
const getActivityList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, activityFilterableFields);
  const result = await activityService.getActivityListIntoDb(options, filters,req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity list retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// get Activity by id
const getMyActivityList = catchAsync(async (req: Request, res: Response) => {
  const result = await activityService.getMyActivityList(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My Activity retrieved successfully',
    data: result,
  });
});
// get Activity by id
const getActivityById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await activityService.getActivityById(id,req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity details retrieved successfully',
    data: result,
  });
});

// update Activity
const updateActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await activityService.updateActivityIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity updated successfully',
    data: result,
  });
});
const completeActivity = catchAsync(async (req: Request, res: Response) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const result = await activityService.markActivityCompleted(
    activityId,
    userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity completed successfully',
    data: result,
  });
});

// delete Activity
const deleteActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await activityService.deleteActivityIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity deleted successfully',
    data: result,
  });
});

export const activityController = {
  createActivity,
  getActivityList,
  getActivityById,
  updateActivity,
  completeActivity,
  deleteActivity,
  getMyActivityList,
};
