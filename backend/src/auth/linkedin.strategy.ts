import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
        const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
        const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL');

        console.log('🔍 LinkedIn OAuth Config:', {
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
            state: false
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<any> {
        const { id, displayName, emails, photos } = profile;

        const user = {
            linkedinId: id,
            email: emails && emails[0] ? emails[0].value : null,
            name: displayName,
            picture: photos && photos[0] ? photos[0].value : null,
            accessToken,
        };

        done(null, user);
    }
}
