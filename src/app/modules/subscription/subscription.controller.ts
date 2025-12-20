import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { subscriptionService } from './subscription.service';

// create Subscription
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const result = await subscriptionService.createSubscription(data);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription created successfully',
    data: result,
  });
});

// get all Subscription
const subscriptionFilterableFields = ['searchTerm', 'id', 'createdAt'];
const getSubscriptionList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, subscriptionFilterableFields);
  const result = await subscriptionService.getSubscriptionListIntoDb(
    options,
    filters,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription list retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// get Subscription by id
const getSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await subscriptionService.getSubscriptionById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription details retrieved successfully',
    data: result,
  });
});

// update Subscription
const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await subscriptionService.updateSubscriptionIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

// delete Subscription
const deleteSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await subscriptionService.deleteSubscriptionIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription deleted successfully',
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  getSubscriptionList,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
};
