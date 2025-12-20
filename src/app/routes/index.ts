import express from 'express';
import { AuthRouters } from '../modules/Auth/Auth.routes';
import { UserRouters } from '../modules/User/user.routes';
import { PaymentRoutes } from '../modules/Payment/payment.route';
import { FollowRoutes } from '../modules/follow/follow.routes';
import { notificationsRoute } from '../modules/Notifications/Notification.routes';
import { learningLibraryRoutes } from '../modules/learningLibrary/learningLibrary.routes';
import { favoriteRoutes } from '../modules/favorite/favorite.routes';
import { subscriptionRoutes } from '../modules/subscription/subscription.routes';
import { inspireRoutes } from '../modules/inspire/inspire.routes';
import { childrenRoutes } from '../modules/children/children.routes';
import { childDocumentRoutes } from '../modules/childDocument/childDocument.routes';
import { providerRoutes } from '../modules/provider/provider.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/user',
    route: UserRouters,
  },
  {
    path: '/article',
    route: learningLibraryRoutes,
  },
  {
    path: '/favorite',
    route: favoriteRoutes,
  },
  {
    path: '/plan',
    route: subscriptionRoutes,
  },
  {
    path: '/inspiration',
    route: inspireRoutes,
  },
  {
    path: '/child',
    route: childrenRoutes,
  },
  {
    path: '/child-document',
    route: childDocumentRoutes,
  },
  {
    path: '/child-provider',
    route: providerRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/follow',
    route: FollowRoutes,
  },
  {
    path: '/notifications',
    route: notificationsRoute,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
