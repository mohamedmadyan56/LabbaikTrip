import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// TODO: implement AuthService + JwtStrategy + AuthController
// Placeholder module to keep AppModule compilable
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256' as const,
          expiresIn: cfg.get('JWT_EXPIRES_IN') || '24h',
        },
      }),
    }),
  ],
  controllers: [],
  providers: [],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
