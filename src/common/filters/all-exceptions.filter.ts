import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = (req as any).id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: any = exception.getResponse();
      return res.status(status).json({
        success: false,
        error: {
          code: body.code || body.error || 'HTTP_ERROR',
          message: body.message || exception.message,
          details: body.details || undefined,
        },
        requestId,
      });
    }
    if (exception.code === 'P2002') {
      const target = (exception.meta as any)?.target || 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: `${Array.isArray(target) ? target.join(',') : target} already exists`,
        },
        requestId,
      });
    }
    if (exception.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: exception.meta?.cause || 'Record not found',
        },
        requestId,
      });
    }
    if (exception.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REFERENCE', message: 'Invalid relation ID' },
        requestId,
      });
    }
    if (exception.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File too large' },
        requestId,
      });
    }
    this.logger.error(`[${requestId}] ${exception.message}`, exception.stack);
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isDev ? exception.message : 'Internal server error',
      },
      requestId,
    });
  }
}
