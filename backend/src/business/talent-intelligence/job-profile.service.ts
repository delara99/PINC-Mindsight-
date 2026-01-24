import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobProfileService {
    constructor(private prisma: PrismaService) { }

    async createProfile(tenantId: String, data: any) {
        return this.prisma.jobProfile.create({
            data: {
                tenantId: tenantId as string,
                ...data
            }
        });
    }

    async getProfiles(tenantId: String) {
        return this.prisma.jobProfile.findMany({
            where: { tenantId: tenantId as string },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getProfile(id: string) {
        return this.prisma.jobProfile.findUnique({
            where: { id }
        });
    }

    async updateProfile(id: string, data: any) {
        return this.prisma.jobProfile.update({
            where: { id },
            data
        });
    }

    async deleteProfile(id: string) {
        return this.prisma.jobProfile.delete({
            where: { id }
        });
    }
}
