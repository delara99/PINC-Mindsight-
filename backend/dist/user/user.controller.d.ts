import { PrismaService } from '../prisma/prisma.service';
export declare class UserController {
    private prisma;
    constructor(prisma: PrismaService);
    listClients(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        status: import(".prisma/client").$Enums.UserStatus;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        credits: number;
        createdAt: Date;
    }[]>;
    addCredits(id: string, body: {
        amount: number;
    }, req: any): Promise<{
        id: string;
        email: string;
        cpf: string | null;
        cnpj: string | null;
        password: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.UserStatus;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string | null;
        phone: string | null;
        tenantId: string | null;
        credits: number;
        createdAt: Date;
        updatedAt: Date;
        lastActivityAt: Date | null;
    }>;
    registerClient(data: any, req: any): Promise<{
        id: string;
        email: string;
        cpf: string;
        cnpj: string;
        name: string;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        phone: string;
        credits: number;
        createdAt: Date;
    }>;
    updateClient(id: string, data: any, req: any): Promise<{
        id: string;
        email: string;
        cpf: string;
        cnpj: string;
        name: string;
        status: import(".prisma/client").$Enums.UserStatus;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        phone: string;
        credits: number;
        createdAt: Date;
    }>;
    getMe(req: any): Promise<{
        id: string;
        email: string;
        cpf: string;
        cnpj: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        phone: string;
        credits: number;
    }>;
    requestCredit(req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SolicitationStatus;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    } | {
        message: string;
    }>;
}
