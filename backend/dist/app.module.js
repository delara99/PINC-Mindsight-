"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const assessment_module_1 = require("./assessment/assessment.module");
const user_module_1 = require("./user/user.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const connections_module_1 = require("./connections/connections.module");
const site_settings_module_1 = require("./site-settings/site-settings.module");
const big_five_config_module_1 = require("./big-five-config/big-five-config.module");
const activity_tracker_middleware_1 = require("./middleware/activity-tracker.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(activity_tracker_middleware_1.ActivityTrackerMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            prisma_module_1.PrismaModule,
            assessment_module_1.AssessmentModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            connections_module_1.ConnectionsModule,
            site_settings_module_1.SiteSettingsModule,
            big_five_config_module_1.BigFiveConfigModule
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map