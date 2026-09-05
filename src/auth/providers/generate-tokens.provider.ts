import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import { UserEntity } from '../user/user.entity';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

@Injectable()
export class GenerateTokensProvider {

  constructor(
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  // ============================================
  // Method 1: Sign Token (بتوقّع التوكن)
  // ============================================
  public async signToken<T>(
    userId: number,
    expiresIn: string,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  // ============================================
  // Method 2: Generate Tokens (بتولّد التوكنين)
  // ============================================
  public async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    
    const [accessToken, refreshToken] = await Promise.all([

      // توليد الـ Access Token
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTTL,
        { email: user.email },
      ),

      // توليد الـ Refresh Token
      this.signToken(
        user.id,
        this.jwtConfiguration.refreshTokenTTL,
      ),

    ]);

    return { accessToken, refreshToken };
  }
}