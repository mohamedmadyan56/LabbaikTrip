import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(name:string, pin:string, fingerprintId?:string, meta?:{ip:string, ua:string}) {
    let user:any = await this.prisma.admin.findUnique({ where: { name } });
    let role='admin';
    if(!user){ user = await this.prisma.employee.findUnique({ where: { name } }); role='employee'; }
    if(!user || !(await bcrypt.compare(pin, user.passwordHash))){
      throw new UnauthorizedException('Invalid name or PIN');
    }
    const allowedDevices: any[] = (user as any).allowedDevices || [];
    if(role==='employee' && allowedDevices.length){
      const ok = allowedDevices.some((d:any)=> d.visitorId===fingerprintId && d.active);
      if(!ok) throw new UnauthorizedException('هذا الجهاز غير مصرح به');
    }
    const permissions = role==='employee' ? (user as any).permissions : undefined;
    const payload = { sub: user.id, role, name:user.name, permissions };
    const token = this.jwt.sign(payload);
    return { token, user:{ id:user.id, name:user.name, role, permissions } };
  }

 async changePin(user:any, currentPin:string, newPin:string){
    if(currentPin===newPin) throw new BadRequestException('New PIN must be different');
    const prismaModel = user.role==='admin' ? this.prisma.admin : this.prisma.employee;
    const doc:any = await (prismaModel as any).findUnique({ where:{ id: user.id } });
    if(!doc || !(await bcrypt.compare(currentPin, doc.passwordHash))) throw new UnauthorizedException('Current PIN incorrect');
    const hash = await bcrypt.hash(newPin, 12);
    await (prismaModel as any).update({ where:{ id: user.id }, data:{ passwordHash: hash } });
    return { updated:true };
  }










}