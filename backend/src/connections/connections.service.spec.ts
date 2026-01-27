
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsService } from './connections.service';
import { TalkingToService } from '../talking-to/talking-to.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterpretationService } from '../reports/interpretation.service';

// Mock Partial
const mockInterpretationService = {
    generateFullReport: jest.fn().mockImplementation((id) => {
        return Promise.resolve({
            traits: [
                { key: 'EXTRAVERSION', score: 55, facets: [] }, // E = 55 (FLEX)
                { key: 'AGREEABLENESS', score: 20, facets: [] }, // A = 20 (LOW)
                { key: 'CONSCIENTIOUSNESS', score: 80, facets: [] }, // C = 80 (HIGH)
                { key: 'OPENNESS', score: 45, facets: [] }, // O = 45 (FLEX)
                { key: 'NEUROTICISM', score: 60, facets: [] }  // N = 60 (FLEX -> INV 40 = LOW STABILITY? NO. 100-60=40. 40 is FLEX STABILITY)
            ],
            talkingToAnalysis: { talkingto_analysis: [], profile_summary: { dominant_traits: [] } }
        });
    })
};

const mockTalkingToService = {
    analyzeRelationship: jest.fn().mockImplementation((me, partner) => {
        return [
            { dimension: 'Energia Social', diff: me.E - partner.E, key: 'E', traitKey: 'EXTRAVERSION' }
        ];
    })
};

const mockPrismaService = {
    connection: { findUnique: jest.fn().mockResolvedValue({ id: 'conn1', initiatorId: 'user1', partnerId: 'user2', status: 'ACCEPTED' }) },
    assessmentAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'assign1', user: { name: 'TestUser' } }) }
};

describe('ConnectionsService Logic Check', () => {
    let service: ConnectionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConnectionsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: TalkingToService, useValue: mockTalkingToService },
                { provide: InterpretationService, useValue: mockInterpretationService },
            ],
        }).compile();

        service = module.get<ConnectionsService>(ConnectionsService);
    });

    it('should extract scores correctly and pass to analyzeRelationship', async () => {
        const result = await service.getComparisonData('conn1', 'user1', undefined);

        expect(result).toBeDefined();
        expect(mockInterpretationService.generateFullReport).toHaveBeenCalledTimes(2); // Me + Partner

        // Check Radar Data
        const radar = result.radarData;
        console.log('Radar Data:', radar);

        // Validate Extroversion (Middle of array)
        // Radar items: O, C, E, A, N. Index 2 is E.
        const eData = radar.find(r => r.subject === 'Extroversão');
        expect(eData).toBeDefined();
        expect(eData.A).toBe(55); // Should match mock score

        // Validate Agreeableness (Low)
        const aData = radar.find(r => r.subject === 'Agradabilidade');
        expect(aData.A).toBe(20);

        // Validate Keys passed to analyzeRelationship (check mock call arguments)
        const [meScores, partnerScores] = (mockTalkingToService.analyzeRelationship as jest.Mock).mock.calls[0];
        console.log('Me Scores passed to Analyze:', meScores);

        expect(meScores.E).toBe(55);
        expect(meScores.EXTRAVERSION).toBe(55); // Should have both keys
        expect(meScores.O).toBe(45);
    });
});
