import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityTrackerMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Check if user is authenticated (has userId in request)
        const userId = (req as any).user?.userId;

        if (userId) {
            // Update last activity asynchronously (don't block request)
            this.prisma.user.update({
                where: { id: userId },
                data: { lastActivityAt: new Date() }
            }).catch(() => {
                // Silently fail - don't break request if update fails
            });
        }

        next();
    }
}
