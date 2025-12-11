import { PrismaService } from '../prisma/prisma.service';
export declare class ConnectionsService {
    private prisma;
    constructor(prisma: PrismaService);
    sendInvite(senderId: string, email: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    }>;
    getConnections(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        connectionId: string;
    }[]>;
    getPendingRequests(userId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    })[]>;
    acceptRequest(requestId: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        userAId: string;
        userBId: string;
        cancelledBy: string | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
        adminNotes: string | null;
    }>;
    rejectRequest(requestId: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    }>;
    removeConnection(connectionId: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        userAId: string;
        userBId: string;
        cancelledBy: string | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
        adminNotes: string | null;
    }>;
    getConnectionDetail(connectionId: string, userId: string): Promise<{
        connectionId: string;
        partner: {
            id: string;
            email: string;
            name: string;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string;
        };
        mySettings: {};
        theirSettings: {};
    }>;
    updateSharingSettings(connectionId: string, userId: string, settings: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        connectionId: string;
        shareInventories: boolean;
        shareFeedbacks: boolean;
        shareQuestionnaires: boolean;
        shareActivityHistory: boolean;
    }>;
    getSharedContent(connectionId: string, requesterId: string): Promise<any>;
    sendMessage(connectionId: string, senderId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        connectionId: string;
        senderId: string;
        content: string;
        readAt: Date | null;
    }>;
    getMessages(connectionId: string, userId: string): Promise<({
        sender: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        connectionId: string;
        senderId: string;
        content: string;
        readAt: Date | null;
    })[]>;
    generateInviteLink(creatorId: string): Promise<{
        token: string;
        link: string;
        expiresAt: Date;
    }>;
    validateInviteToken(token: string): Promise<{
        creator: {
            id: string;
            email: string;
            name: string;
            companyName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.InviteLinkStatus;
        createdAt: Date;
        updatedAt: Date;
        token: string;
        expiresAt: Date | null;
        creatorId: string;
        usedById: string | null;
    }>;
    acceptInviteViaToken(token: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    }>;
    getPendingAdminApprovals(adminId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
            companyName: string;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
            companyName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    })[]>;
    approveConnectionByAdmin(requestId: string, adminId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        userAId: string;
        userBId: string;
        cancelledBy: string | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
        adminNotes: string | null;
    }>;
    rejectConnectionByAdmin(requestId: string, adminId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        senderId: string;
        receiverId: string;
        requiresAdminApproval: boolean;
        approvedByAdminId: string | null;
    }>;
    getAllConnectionsAdmin(adminId: string): Promise<({
        _count: {
            messages: number;
        };
        userA: {
            id: string;
            email: string;
            name: string;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string;
        };
        userB: {
            id: string;
            email: string;
            name: string;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string;
        };
        cancelledByUser: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        userAId: string;
        userBId: string;
        cancelledBy: string | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
        adminNotes: string | null;
    })[]>;
    adminCancelConnection(connectionId: string, adminId: string, reason?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        userAId: string;
        userBId: string;
        cancelledBy: string | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
        adminNotes: string | null;
    }>;
    getConnectionMessagesAdmin(connectionId: string, adminId: string): Promise<{
        connection: {
            id: string;
            userA: {
                email: string;
                name: string;
            };
            userB: {
                email: string;
                name: string;
            };
            status: import(".prisma/client").$Enums.ConnectionStatus;
            createdAt: Date;
        };
        messages: ({
            sender: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            connectionId: string;
            senderId: string;
            content: string;
            readAt: Date | null;
        })[];
        messageCount: number;
    }>;
}
