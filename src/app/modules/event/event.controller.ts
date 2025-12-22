import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pickValidFields';
import { eventService } from './event.service';

// create Event
const createEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.createEvent(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

// get all Event
const eventFilterableFields = [
  'searchTerm',
  'id',
  'createdAt',
  'status',
  'date',
  'childId',
];

const getEventList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, eventFilterableFields);
  const userId = req.user.id;
  const result =
    await eventService.getEventListForAllChildOrSingleChildByDateIntoDb(
      options,
      filters,
      userId,
    );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully for the child',
    meta: result.meta,
    data: result.data,
  });
});

// get Event by id
const getEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await eventService.getEventById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event details retrieved successfully',
    data: result,
  });
});

// update Event
const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.updateEventIntoDb(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});
const markAsCompleted = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.updateEventStatus(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event status updated successfully',
    data: result,
  });
});

// delete Event
const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await eventService.deleteEventIntoDb(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

export const eventController = {
  createEvent,
  getEventList,
  getEventById,
  updateEvent,
  markAsCompleted,
  deleteEvent,
};
