import { prisma } from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

interface MonthlyData {
  labels: string[];
  users: number[];
  totalUsersByMonth: number[];
}

interface DashboardData {
  totalUsers: number;
  totalRevenue: number;
  totalContent: number;
  subscribedUsers: number;
  monthlyGrowth: MonthlyData;
}

const getDashboardData = async (adminId: string): Promise<DashboardData> => {
  // Verify admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
  }

  // 1. Total Users (excluding deleted)
  const totalUsers = await prisma.user.count({
    where: { isDeleted: false },
  });

  // 2. Total Subscribed Users (has stripeCustomerId)
  const subscribedUsers = await prisma.user.count({
    where: {
      isDeleted: false,
      stripeCustomerId: { not: null },
    },
  });

  // 3. Total Content (Learning Library articles)
  const totalContent = await prisma.learningLibrary.count();

  // 4. Total Revenue (sum of all payments)
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
  });
  const totalRevenue = totalRevenueResult._sum.amount || 0;

  // 5. Monthly New User Growth for 2025
  const currentYear = new Date().getFullYear();

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'June',
    'July',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthlyUsers = await Promise.all(
    months.map(async (_, index) => {
      const start = new Date(currentYear, index, 1);
      const end = new Date(currentYear, index + 1, 1);

      const count = await prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });

      return count;
    }),
  );

  // Calculate cumulative total users up to each month (for tooltip)
  const totalUsersByMonth = monthlyUsers.reduce(
    (acc: number[], curr: number, idx: number) => {
      const prev = idx === 0 ? 0 : acc[idx - 1];
      acc.push(prev + curr);
      return acc;
    },
    [],
  );

  return {
    totalUsers,
    totalRevenue,
    totalContent,
    subscribedUsers,
    monthlyGrowth: {
      labels: months,
      users: monthlyUsers,
      totalUsersByMonth,
    },
  };
};

export const MetaServices = {
  getDashboardData,
};
