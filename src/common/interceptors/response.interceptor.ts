import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // لو الـ controller أرجع {data, pagination} نلفه
        if (data && typeof data==='object' && ('pagination' in data || 'data' in data)) {
          return { success:true, ...data };
        }
        return { success:true, data };
      }),
    );
  }
}