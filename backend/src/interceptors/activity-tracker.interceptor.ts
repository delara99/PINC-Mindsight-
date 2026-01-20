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
            const referer = request.headers['referer'] || request.headers['referrer'];
            let currentPath = null;

            if (referer) {
                try {
                    const url = new URL(referer);
                    currentPath = url.pathname; // Gets '/dashboard/...'
                } catch (e) {
                    // Invalid URL, ignore
                }
            }

            this.prisma.user.update({
                where: { id: user.userId },
                data: {
                    lastActivityAt: new Date(),
                    lastPage: currentPath
                }
            }).catch(err => {
                // Silently ignore errors
            });
        }

        return next.handle();
    }
}
