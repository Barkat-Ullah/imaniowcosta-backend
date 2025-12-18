import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';
import { Request } from 'express';
import pick from '../../utils/pickValidFields';

// get all LearningLibrary
const getFilterableFields = ['searchTerm', 'id', 'createdAt', 'status'];
const getAllUsers = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, getFilterableFields);
  const result = await UserServices.getAllUsersFromDB(options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Users retrieved successfully',
    ...result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const id = req.user.id;
  const result = await UserServices.getMyProfileFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile retrieved successfully',
    data: result,
  });
});
const getMyCaregivers = catchAsync(async (req, res) => {
  const creatorId = req.user.id;
  const result = await UserServices.getMyCareGiverFromDB(creatorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'care givers retrieved successfully',
    data: result,
  });
});
const getMyChildren = catchAsync(async (req, res) => {
  const creatorId = req.user.id;
  const result = await UserServices.getMyChildrenFromDB(creatorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Children retrieved successfully',
    data: result,
  });
});

const getUserDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getUserDetailsFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

const updateUserRoleStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const role = req.body.role;
  const result = await UserServices.updateUserRoleStatusIntoDB(id, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User role updated successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  // const status = req.body.status;
  const result = await UserServices.updateUserStatus(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User status updated successfully',
    data: result,
  });
});
const updateUserApproval = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const result = await UserServices.updateUserApproval(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User approved successfully',
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req, res) => {
  const id = req.user.id;
  const result = await UserServices.softDeleteUserIntoDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User soft deleted successfully',
    data: result,
  });
});
const hardDeleteUser = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const result = await UserServices.hardDeleteUserIntoDB(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User soft deleted successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await UserServices.updateUserIntoDb(req, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully!',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const id = req.user.id;
  const result = await UserServices.updateMyProfileIntoDB(id, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

export const UserControllers = {
  getAllUsers,
  getMyProfile,
  getUserDetails,
  updateUserRoleStatus,
  updateUserStatus,
  updateUserApproval,
  softDeleteUser,
  hardDeleteUser,
  updateUser,
  updateMyProfile,
  getMyCaregivers,
  getMyChildren,
};
