import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import passport from '../src/services/passport.service.js';
import AuthRouter from './routes/auth.routes.js';
import errorMiddleware from './errors/error.middleware.js';
import CookieParser from 'cookie-parser';
import AIChatRouter from './routes/AIChat.routes.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false}))
app.use(passport.initialize());
app.use(CookieParser());
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to accept
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


app.use('/api/auth', AuthRouter);
app.use('/api/chat', AIChatRouter)

app.use(errorMiddleware);

export default app;
