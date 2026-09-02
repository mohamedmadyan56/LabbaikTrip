import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type RequestWithId = Request & {
  id?: string;
};

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const requestId = request.id;

    const result = this.resolveException(exception);

    if (result.log) {
      this.logger.error(
        `[${requestId ?? 'no-request-id'}] ${result.log.message}`,
        result.log.stack,
      );
    }

    response.status(result.status).json({
      success: false,
      error: {
        code: result.code,
        message: result.message,
        ...(result.details !== undefined && {
          details: result.details,
        }),
      },
      ...(requestId && { requestId }),
    } satisfies ErrorResponse);
  }

  private resolveException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    log?: {
      message: string;
      stack?: string;
    };
  } {
    /**
     * 1. NestJS HttpException
     */
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          status,
          code: this.getHttpCode(status),
          message: exceptionResponse,
        };
      }

      if (this.isObject(exceptionResponse)) {
        const message = this.normalizeMessage(
          exceptionResponse.message,
          exception.message,
        );

        return {
          status,
          code:
            this.asString(exceptionResponse.code) ??
            this.asString(exceptionResponse.error) ??
            this.getHttpCode(status),
          message,
          details: exceptionResponse.details,
        };
      }

      return {
        status,
        code: this.getHttpCode(status),
        message: exception.message,
      };
    }

    /**
     * 2. Prisma errors
     */
    if (this.isPrismaError(exception)) {
      switch (exception.code) {
        case 'P2002': {
          const target = exception.meta?.target;
          const fields = Array.isArray(target)
            ? target.join(', ')
            : String(target ?? 'field');

          return {
            status: HttpStatus.CONFLICT,
            code: 'DUPLICATE_KEY',
            message: `${fields} already exists`,
          };
        }

        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            code: 'NOT_FOUND',
            message: 'Record not found',
          };

        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'INVALID_REFERENCE',
            message: 'Invalid relation ID',
          };

        case 'P2024':
          return {
            status: HttpStatus.SERVICE_UNAVAILABLE,
            code: 'DATABASE_TIMEOUT',
            message: 'Database temporarily unavailable',
          };
      }
    }

    /**
     * 3. Multer errors
     */
    if (this.isMulterError(exception)) {
      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'FILE_TOO_LARGE',
            message: 'File too large',
          };

        case 'LIMIT_UNEXPECTED_FILE':
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field',
          };

        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'FILE_UPLOAD_ERROR',
            message: 'File upload failed',
          };
      }
    }

    /**
     * 4. Unknown errors
     */
    const errorMessage = this.getErrorMessage(exception);
    const errorStack = this.getErrorStack(exception);
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? errorMessage : 'Internal server error',
      ...(isDevelopment && {
        details: {
          stack: errorStack,
        },
      }),
      log: {
        message: errorMessage,
        stack: errorStack,
      },
    };
  }

  private isObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null;
  }

  private isPrismaError(
    value: unknown,
  ): value is {
    code: string;
    meta?: {
      target?: string | string[];
      cause?: string;
    };
  } {
    return (
      this.isObject(value) &&
      typeof value.code === 'string' &&
      /^P\d{4}$/.test(value.code)
    );
  }

  private isMulterError(
    value: unknown,
  ): value is {
    code: string;
    message: string;
  } {
    return (
      this.isObject(value) &&
      typeof value.code === 'string' &&
      [
        'LIMIT_FILE_SIZE',
        'LIMIT_FILE_COUNT',
        'LIMIT_FIELD_KEY',
        'LIMIT_FIELD_VALUE',
        'LIMIT_FIELD_COUNT',
        'LIMIT_UNEXPECTED_FILE',
        'MISSING_FIELD_NAME',
      ].includes(value.code)
    );
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return 'Unknown error';
  }

  private getErrorStack(exception: unknown): string | undefined {
    return exception instanceof Error ? exception.stack : undefined;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private normalizeMessage(value: unknown, fallback: string): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return typeof value === 'string' ? value : fallback;
  }

  private getHttpCode(status: number): string {
    const name = HttpStatus[status];

    return name
      ? name
          .replace(/[A-Z]/g, (letter, index) =>
            index === 0 ? letter : `_${letter}`,
          )
          .toUpperCase()
      : 'HTTP_ERROR';
  }
}
