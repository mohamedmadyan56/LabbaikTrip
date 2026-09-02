import {Injectable,NestInterceptor,ExecutionContext,CallHandler} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
@Injectable()

export class RequestIdInterceptor implements NestInterceptor{

  intercept(ctx:ExecutionContext,next:CallHandler){
    const req= ctx.switchToHttp().getRequest();
        const res = ctx.switchToHttp().getResponse();
           req.id = req.headers['x-request-id'] || uuidv4();
            res.setHeader('X-Request-Id', req.id);
             return next.handle();
  }





}