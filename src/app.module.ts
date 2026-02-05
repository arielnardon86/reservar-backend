import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { ServicesModule } from './services/services.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CustomersModule } from './customers/customers.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OnboardingTokensModule } from './onboarding-tokens/onboarding-tokens.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TenantsModule,
    ServicesModule,
    ProfessionalsModule,
    SchedulesModule,
    AppointmentsModule,
    CustomersModule,
    AuthModule,
    NotificationsModule,
    OnboardingTokensModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de tenant a todas las rutas admin
    // El middleware solo extrae tenantId, no bloquea requests sin tenantId
    consumer
      .apply(TenantMiddleware)
      .forRoutes('tenants', 'services', 'professionals', 'schedules', 'appointments', 'customers');
  }
}

