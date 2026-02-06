import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalOAuthError } from 'passport-oauth2';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
        const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
        const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL');

        console.log('🔍 LinkedIn OAuth Config (Hybrid):', {
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
            state: false, // Critical for stateless NestJS
        });
    }

    // SOBRESCREVER método de profile para usar OIDC (UserInfo) em vez da API v2/me legada
    userProfile(accessToken: string, done: Function) {
        // @ts-ignore - _oauth2 property exists on the strategy instance
        this._oauth2.get('https://api.linkedin.com/v2/userinfo', accessToken, (err: any, body: string, res: any) => {
            if (err) {
                console.error('LinkedIn UserInfo Error:', err);
                return done(new InternalOAuthError('failed to fetch user profile', err));
            }
            try {
                const json = JSON.parse(body);

                // Mapeamento manual do OIDC Response
                const profile = {
                    provider: 'linkedin',
                    id: json.sub,
                    displayName: json.name,
                    email: json.email,
                    picture: json.picture,
                    emails: [{ value: json.email }],
                    photos: [{ value: json.picture }],
                    _raw: body,
                    _json: json
                };

                done(null, profile);
            } catch (e) {
                done(e);
            }
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<any> {
        console.log('🔍 LinkedIn Validated Profile:', JSON.stringify(profile));

        const user = {
            linkedinId: profile.id,
            email: profile.email, // Já mapeado acima
            name: profile.displayName,
            picture: profile.picture,
            accessToken,
        };

        done(null, user);
    }
}
