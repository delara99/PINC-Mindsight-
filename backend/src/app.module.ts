import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AssessmentModule } from './assessment/assessment.module';
import { UserModule } from './user/user.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { ConnectionsModule } from './connections/connections.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { BigFiveConfigModule } from './big-five-config/big-five-config.module';
import { ActivityTrackerInterceptor } from './interceptors/activity-tracker.interceptor';
import { CrossProfileModule } from './reports/cross-profile/cross-profile.module';
import { CouponsModule } from './coupons/coupons.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MigrationModule } from './migration/migration.module';
import { FixModule } from './fix/fix.module';
import { PaymentModule } from './payment/payment.module';
import { InterpretationModule } from './interpretation/interpretation.module';
import { TalkingToModule } from './talking-to/talking-to.module';
import { BusinessModule } from './business/business.module';
import { CalculationEngineModule } from './calculation-engine/calculation-engine.module';
import { SeedController } from './admin/seed.controller';

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
        MigrationModule,
        FixModule,
        PaymentModule,
        InterpretationModule,
        TalkingToModule,
        BusinessModule,
        CalculationEngineModule
    ],
    controllers: [SeedController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ActivityTrackerInterceptor,
        },
    ],
})
export class AppModule { }
