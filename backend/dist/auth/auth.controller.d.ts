import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            credits: any;
            userType: any;
        };
    } | {
        message: string;
    }>;
    register(body: any): Promise<{
        message: string;
        user: {
            email: string;
            name: string;
        };
    }>;
}
