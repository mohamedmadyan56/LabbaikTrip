import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check(@Req() req: any) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        data: {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          requestId: req.id,
        },
      };
    } catch {
      return {
        success: true,
        data: {
          status: 'degraded',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          requestId: req.id,
        },
      };
    }
  }
}
