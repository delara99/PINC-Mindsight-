import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
        const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
        const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL');

        console.log('🔍 LinkedIn OAuth Config (Manual):', {
            clientID: clientID ? `${clientID.substring(0, 5)}...` : 'MISSING',
            clientSecret: clientSecret ? 'SET' : 'MISSING',
            callbackURL: callbackURL || 'MISSING'
        });

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('LinkedIn OAuth environment variables are not set properly.');
        }

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['openid', 'profile', 'email'],
            state: false,
            skipUserProfile: true, // 🚨 CRUCIAL: Pula o fetch automático quebrado da biblioteca
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        _profile: any, // Perfil vem vazio pois pulamos o fetch
        done: Function,
    ): Promise<any> {
        try {
            console.log('🔍 LinkedIn Manual Fetch with Token:', accessToken ? 'PRESENT' : 'MISSING');

            // Fetch manual robusto usando a API OIDC nova
            const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            console.log('🔍 LinkedIn UserInfo Response:', JSON.stringify(response.data));

            const json = response.data;

            const user = {
                linkedinId: json.sub,
                email: json.email,
                name: json.name,
                picture: json.picture,
                accessToken,
            };

            done(null, user);
        } catch (error) {
            console.error('LinkedIn Manual Fetch Error:', error?.response?.data || error.message);
            done(error, null);
        }
    }
}
