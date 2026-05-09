import express from 'express';
import morgan from 'morgan';
import passport from '../src/services/passport.service.js';
import AuthRouter from './routes/auth.routes.js';
import errorMiddleware from './errors/error.middleware.js';
import CookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false}))
app.use(passport.initialize());
app.use(CookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
  res.send("Server is running")
});


app.use('/api/auth', AuthRouter);

app.use(errorMiddleware);

export default app;
