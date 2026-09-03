import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/authorize.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const perm = this.reflector.getAllAndOverride<{feature:string, action:string}>(PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!perm) return true;
    const req = ctx.switchToHttp().getRequest();
    const { role, permissions } = req.user || {};
    if (role==='admin') return true; // admin يتخطى كل شيء — نفس منطق authorize.js:9
    if (role==='employee') {
      const ok = permissions?.[perm.feature]?.[perm.action] === true;
      if (ok) return true;
      throw new ForbiddenException(`You do not have permission to ${perm.action} ${perm.feature}`);
    }
    throw new ForbiddenException('Forbidden');
  }
}