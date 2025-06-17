import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { ValidationsModule } from './modules/validations/validations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { LaboratoriesModule } from './modules/laboratories/laboratories.module';
import { QRCodesModule } from './modules/qrcodes/qrcodes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.production'],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    // Core modules
    DatabaseModule,
    AuthModule,
    HealthModule,
    
    // Feature modules
    UsersModule,
    CompaniesModule,
    LaboratoriesModule,
    ProductsModule,
    ValidationsModule,
    ReportsModule,
    QRCodesModule,
    NotificationsModule,
  ],
})
export class AppModule {}