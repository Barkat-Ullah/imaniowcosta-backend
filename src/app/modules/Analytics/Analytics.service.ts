// src/utils/analytics.utils.ts

import prisma from '../../utils/prisma';
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

export const getAnalyticsArticleByPeriod = async (
  userId: string,
  period: AnalyticsPeriod = 'week',
) => {
  let startDate: Date;
  let endDate: Date;
  const now = new Date();

  if (period === 'week') {
    // Current week: Sunday to Saturday
    startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay()); // Sunday
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Current month: 1st to last day
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

  // === 1. Activity Completion Analytics (Bar Chart + Breakdown) ===
  const activityCompletions = await prisma.userCompletedActivity.findMany({
    where: {
      userId,
      completedAt: { gte: startDate, lte: endDate },
    },
    include: {
      activity: {
        select: { title: true, image: true },
      },
    },
    orderBy: { completedAt: 'asc' },
  });

  // Bar Chart: Count per day
  const dayCounts: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  const dayMap: Record<number, string> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  };

  activityCompletions.forEach(comp => {
    const dayIndex = new Date(comp.completedAt).getDay();
    const dayName = dayMap[dayIndex];
    dayCounts[dayName]++;
  });

  const dailyCounts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
    day => ({
      day,
      count: dayCounts[day],
    }),
  );

  const totalActivityDays = dailyCounts.filter(d => d.count > 0).length;

  // Breakdown: List of completed activities with day name
  const activityBreakdown = activityCompletions.map(comp => ({
    image: comp.activity.image,
    title: comp.activity.title,
    day: comp.completedAt.toLocaleDateString('en-US', { weekday: 'long' }), // Monday, Tuesday...
  }));

  // === Final Response ===
  return {
    period,
    range: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    activities: {
      totalActivityDays,
      dailyCounts, // for bar chart
      breakdown: activityBreakdown, // for popup list
    },
  };
};
