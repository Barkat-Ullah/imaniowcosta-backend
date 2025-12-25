import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { BehaviorLogService } from './behaviorLog.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const updateBehaviorLog = catchAsync(async (req: Request, res: Response) => {
  const { childId, selectedBehaviors } = req.body;
  const userId = req.user.id;

  // [{ behavior: string, date: string }]

  const result = await BehaviorLogService.createMultipleEntries(
    {
      childId,
      selectedBehaviors,
    },
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Behavior log updated successfully',
    data: result,
  });
});

const getBehaviorLogByChild = catchAsync(
  async (req: Request, res: Response) => {
    const { childId } = req.params;
    const userId = req.user.id;

    const result = await BehaviorLogService.getBehaviorLogByChild(
      childId,
      userId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Behavior log retrieved successfully',
      data: result,
    });
  },
);

export const BehaviorLogController = {
  updateBehaviorLog,
  getBehaviorLogByChild,
};
