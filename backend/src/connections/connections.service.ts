
    async getComparisonData(connectionId: string, userId: string) {
        const connection = await this.prisma.connection.findFirst({
            where: { id: connectionId, OR: [{ userAId: userId }, { userBId: userId }] },
            include: { userA: true, userB: true, sharingSettings: true }
        });
        if (!connection) throw new NotFoundException('Conexão não encontrada');
        
        const otherUserId = connection.userAId === userId ? connection.userBId : connection.userAId;
        const [a, b] = await Promise.all([
            this.prisma.assessmentAssignment.findFirst({
                where: { userId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { user: true }
            }),
            this.prisma.assessmentAssignment.findFirst({
                where: { userId: otherUserId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { user: true }
            })
        ]);
        
        if (!a || !b) throw new NotFoundException('Sem avaliações');
        
        const s1 = (a as any).result?.scores || {};
        const s2 = (b as any).result?.scores || {};
        
        return {
            user1: { name: a.user.name, email: a.user.email, scores: s1 },
            user2: { name: b.user.name, email: b.user.email, scores: s2 },
            insights: { compatibility: 50, strengths: [], differences: [] }
        };
    }
}
