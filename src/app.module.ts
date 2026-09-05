import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PilgrimsModule } from './modules/pilgrims/pilgrims.module.js';
import { TripsModule } from './modules/trips/trips.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { GenerateTokensProvider } from './auth/providers/generate-tokens.provider.js';





@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const schema = Joi.object({
          NODE_ENV: Joi.string()
            .valid('development', 'production', 'test')
            .required(),
          PORT: Joi.number().port().required(),
          DATABASE_URL: Joi.string()
            .uri({ scheme: ['postgresql', 'postgres'] })
            .required(),
          JWT_SECRET: Joi.string().min(32).required(),
          CORS_ORIGIN: Joi.string().required(),
          JWT_EXPIRES_IN: Joi.string().default('24h'),
          MAX_FILE_SIZE_MB: Joi.number().default(20),
          LOG_LEVEL: Joi.string().default('debug'),
        });
        const { error, value } = schema.validate(config, {
          abortEarly: false,
          allowUnknown: true,
        });
        if (error) throw new Error(`Config validation error: ${error.message}`);
        return value;
      },
    }),
    PrismaModule, // ← يتصل بـ Postgres عبر PrismaService.$connect() — لا حاجة لـ forRootAsync
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]), // generalLimiter
    AuthModule,
    PilgrimsModule,
    TripsModule,
    // DelegatesModule, EmployeesModule, GroupsModule, FlightRoutesModule,
    // ContractsModule, DocumentsModule, HajjApplicantsModule, TasksModule,
    // TemplatesModule, SettingsModule, ActivitiesModule, DashboardModule, FilesModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, GenerateTokensProvider],
})

export class AppModule {}
