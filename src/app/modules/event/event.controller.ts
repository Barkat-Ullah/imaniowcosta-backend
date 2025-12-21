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
const eventFilterableFields = ['searchTerm', 'id', 'createdAt', 'status'];
const getEventList = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, eventFilterableFields);
  const result = await eventService.getEventListIntoDb(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event list retrieved successfully',
    data: result,
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
  const { id } = req.params;
  const data = req.body;
  const result = await eventService.updateEventIntoDb(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
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
  deleteEvent,
};
