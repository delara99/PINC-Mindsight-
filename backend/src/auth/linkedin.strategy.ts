import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
        const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
        const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL');

        console.log('🔍 LinkedIn OAuth Config (OIDC):', {
            clientID: clientID ? `${clientID.substring(0, 5)}...` : 'MISSING',
            clientSecret: clientSecret ? 'SET' : 'MISSING',
            callbackURL: callbackURL || 'MISSING'
        });

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('LinkedIn OAuth environment variables are not set properly.');
        }

        super({
            issuer: 'https://www.linkedin.com',
            authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
            tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
            userInfoURL: 'https://api.linkedin.com/v2/userinfo',
            clientID,
            clientSecret,
            callbackURL,
            scope: ['openid', 'profile', 'email'],
            state: false // Stateless
        });
    }

    async validate(
        issuer: string,
        profile: any,
        done: Function,
    ): Promise<any> {
        console.log('🔍 LinkedIn OIDC Profile:', JSON.stringify(profile));

        // Note: passport-openidconnect returns a normalized profile.
        // id -> sub
        // displayName -> name
        // emails -> from userinfo (maybe)

        // profile structure:
        // { provider: 'openid', id: '...', displayName: '...', name: { familyName, givenName }, emails: [ { value: '...' } ], ... }

        // Handling LinkedIn Specifics (sometimes email is not mapped directly if claim is different)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        const user = {
            linkedinId: profile.id,
            email: email,
            name: profile.displayName,
            picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            accessToken: 'oidc-access-token', // We might not get raw access token in this signature easily without passReqToCallback, but we don't need it for DB.
        };

        done(null, user);
    }
}
