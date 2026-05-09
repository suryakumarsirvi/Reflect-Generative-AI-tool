import passport from 'passport';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import { CONFIG } from '../configs/env.config.js';

passport.use(new GoogleStrategy({
    clientID: CONFIG.GOOGLE_OAUTH_CLIENTID,
    clientSecret: CONFIG.GOOGLE_OAUTH_SECRETKEY,
    callbackURL: CONFIG.GOOGLE_OAUTH_CALLBACK
}, (accessToken, refreshToken, profile, done)=>{

    return done(null, profile);
}));

export default passport