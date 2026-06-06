import {Router} from 'express';
import passport from '../services/passport.service.js';
import validate from '../middlewares/zod.middleware.js';
import {checkAuth} from '../middlewares/auth.middleware.js';
import { validateUserSchema } from '../validators/zod.validate.js';
import { handleGoogleAuth, handleLogin, handleLogout, handleRegister, handleGetMe, handleRefresh, handleUpdateProfile, handleSubscribePro } from '../controllers/auth.controller.js';

const AuthRouter = Router();

AuthRouter.post('/register', validate(validateUserSchema), handleRegister);
AuthRouter.post('/login', validate(validateUserSchema), handleLogin);
AuthRouter.post('/logout', checkAuth, handleLogout);

AuthRouter.get('/refresh', handleRefresh);
AuthRouter.get('/getMe', checkAuth, handleGetMe);
AuthRouter.put('/profile', checkAuth, handleUpdateProfile);
AuthRouter.post('/subscribe', checkAuth, handleSubscribePro);

AuthRouter.get('/google', passport.authenticate('google', { scope: ['profile email'], session: false }));
AuthRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login',  session: false }), handleGoogleAuth)

export default AuthRouter;