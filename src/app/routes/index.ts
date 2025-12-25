import express from 'express';
import { AuthRouters } from '../modules/Auth/Auth.routes';
import { UserRouters } from '../modules/User/user.routes';
import { PaymentRoutes } from '../modules/Payment/payment.route';
import { notificationsRoute } from '../modules/Notifications/Notification.routes';
import { learningLibraryRoutes } from '../modules/learningLibrary/learningLibrary.routes';
import { favoriteRoutes } from '../modules/favorite/favorite.routes';
import { subscriptionRoutes } from '../modules/subscription/subscription.routes';
import { inspireRoutes } from '../modules/inspire/inspire.routes';
import { childrenRoutes } from '../modules/children/children.routes';
import { childDocumentRoutes } from '../modules/childDocument/childDocument.routes';
import { providerRoutes } from '../modules/provider/provider.routes';
import { healthCareNoteRoutes } from '../modules/healthCareNote/healthCareNote.routes';
import { preferenceSensoryNoteRoutes } from '../modules/preferenceSensoryNote/preferenceSensoryNote.routes';
import { MetaRoutes } from '../modules/meta/meta.routes';
import { activityRoutes } from '../modules/activity/activity.routes';
import { eventRoutes } from '../modules/event/event.routes';
import { BehaviorLogRoutes } from '../modules/behaviorLog/behaviorLog.routes';
import { AnalyticsRoutes } from '../modules/Analytics/Analytics.routes';

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
    path: '/events',
    route: eventRoutes,
  },
  {
    path: '/child',
    route: childrenRoutes,
  },
  {
    path: '/child-behavior',
    route: BehaviorLogRoutes,
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
    path: '/child-healthcare',
    route: healthCareNoteRoutes,
  },
  {
    path: '/child-sensory',
    route: preferenceSensoryNoteRoutes,
  },
  {
    path: '/activity-blog',
    route: activityRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/notifications',
    route: notificationsRoute,
  },
  {
    path: '/meta',
    route: MetaRoutes,
  },
  {
    path: '/analytics',
    route: AnalyticsRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
