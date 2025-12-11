import { ConnectionsService } from './connections.service';
export declare class ConnectionsController {
    private readonly connectionsService;
    constructor(connectionsService: ConnectionsService);
    sendInvite(body: {
        email: string;
    }, req: any): Promise<{
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
    generateInviteLink(req: any): Promise<{
        token: string;
        link: string;
        expiresAt: Date;
    }>;
    validateInvite(token: string): Promise<{
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
    acceptInviteViaLink(token: string, req: any): Promise<{
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
    getPendingAdminApprovals(req: any): Promise<({
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
    approveConnection(id: string, req: any): Promise<{
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
    rejectConnection(id: string, req: any): Promise<{
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
    getAllConnectionsAdmin(req: any): Promise<({
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
    adminCancelConnection(id: string, body: {
        reason?: string;
    }, req: any): Promise<{
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
    getConnectionMessagesAdmin(id: string, req: any): Promise<{
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
    getPendingRequests(req: any): Promise<({
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
    getConnections(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        userType: import(".prisma/client").$Enums.UserType;
        companyName: string;
        connectionId: string;
    }[]>;
    getConnectionDetail(id: string, req: any): Promise<{
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
    getSharedContent(id: string, req: any): Promise<any>;
    getMessages(id: string, req: any): Promise<({
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
    updateSettings(id: string, body: any, req: any): Promise<{
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
    sendMessage(id: string, body: {
        content: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        connectionId: string;
        senderId: string;
        content: string;
        readAt: Date | null;
    }>;
    acceptRequest(id: string, req: any): Promise<{
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
    rejectRequest(id: string, req: any): Promise<{
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
    removeConnection(id: string, req: any): Promise<{
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
}
