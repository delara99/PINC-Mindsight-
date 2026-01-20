import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class ActivityTrackerInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // "Fire and forget" update logic - doesn't block response
        if (user && user.userId) {
            this.prisma.user.update({
                where: { id: user.userId },
                data: { lastActivityAt: new Date() }
            }).catch(err => {
                // Silently ignore errors to avoid affecting the main request
                // console.error('Failed to update last outcome', err); 
            });
        }

        return next.handle();
    }
}
