import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AnalyticsPeriod, getAnalyticsByPeriod } from './Analytics.service';


export const getWeeklyAnalyticsData = catchAsync(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const userId = req.user.id;
  const period = (req.query.period as 'week' | 'month') || 'week';

  const result = await getAnalyticsByPeriod(
    childId,
    userId,
    period as AnalyticsPeriod,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Behavior log retrieved successfully',
    data: result,
  });
});
