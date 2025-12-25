// src/utils/analytics.utils.ts

import { BehaviorLogService } from '../behaviorLog/behaviorLog.service';

export type AnalyticsPeriod = 'week' | 'month';

export const getAnalyticsByPeriod = async (
  childId: string,
  userId: string,
  period: AnalyticsPeriod = 'week',
) => {
  let startDate: Date;
  let endDate: Date;
  const now = new Date();

  if (period === 'week') {
    // Current week: Sunday to Saturday
    startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay());
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  const [potty, foods, positive] = await Promise.all([
    BehaviorLogService.getPottyProgress(childId, startDate, endDate),
    BehaviorLogService.getNewFoodsThisWeek(childId, startDate, endDate),
    BehaviorLogService.getPositiveMoments(childId, startDate, endDate),
  ]);

  return {
    period,
    range: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    potty,
    foods,
    positive,
  };
};
