import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // "Bearer <token>"
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  // ما ترجعه هنا يصبح request.user
  async validate(payload: any) {
    // payload = {sub, role, name, permissions} كما في utils/jwt.js
    if (!payload.sub || !payload.role) throw new UnauthorizedException('Invalid token payload');
    return { id: payload.sub, role: payload.role, name: payload.name, permissions: payload.permissions || null };
  }
}
