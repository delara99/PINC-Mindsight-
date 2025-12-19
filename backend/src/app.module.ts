import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AssessmentModule } from './assessment/assessment.module';
import { UserModule } from './user/user.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { ConnectionsModule } from './connections/connections.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { BigFiveConfigModule } from './big-five-config/big-five-config.module';
import { ActivityTrackerMiddleware } from './middleware/activity-tracker.middleware';
import { CrossProfileModule } from './reports/cross-profile/cross-profile.module';
import { CouponsModule } from './coupons/coupons.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MigrationModule } from './migration/migration.module';

@Module({
    imports: [
        AuthModule,
        UserModule,
        PrismaModule,
        AssessmentModule,
        DashboardModule,
        ReportsModule,
        ConnectionsModule,
        SiteSettingsModule,
        BigFiveConfigModule,
        CrossProfileModule,
        CouponsModule,
        FeedbackModule,
        NotificationsModule,
        MigrationModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(ActivityTrackerMiddleware)
            .forRoutes('*'); // Apply to all routes
    }
}
