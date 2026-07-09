import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/v1/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiResponse } from './utils/ApiResponse.js';

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for local testing flexibility if needed
}));

// CORS Configuration
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Body Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Custom lightweight cookie parsing middleware to reduce npm dependencies
app.use((req, res, next) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json(new ApiResponse(200, { status: 'healthy', uptime: process.uptime() }, 'API server is active'));
});

// REST V1 Routing Entry
app.use('/api/v1', apiRouter);

// Global Exception Handler Middleware
app.use(errorHandler);

export default app;
