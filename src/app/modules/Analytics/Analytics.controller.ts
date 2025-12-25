import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import {
  AnalyticsPeriod,
  getAnalyticsArticleByPeriod,
  getAnalyticsByPeriod,
} from './Analytics.service';

const getAnalyticsByPeriodData = catchAsync(
  async (req: Request, res: Response) => {
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
  },
);

const getAnalyticsArticleByPeriodData = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const period = (req.query.period as 'week' | 'month') || 'week';

    const result = await getAnalyticsArticleByPeriod(
      userId,
      period as AnalyticsPeriod,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Behavior log retrieved successfully',
      data: result,
    });
  },
);
export const analyticsController = {
  getAnalyticsByPeriodData,
  getAnalyticsArticleByPeriodData,
};
