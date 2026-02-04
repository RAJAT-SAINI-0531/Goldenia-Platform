import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import logger from './config/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})); // Allow requests from frontend only
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies - increased limit for file uploads
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parse URL-encoded bodies
app.use(requestIdMiddleware); // Add request ID to each request

// Mount all routes
app.use(routes);

// Error handler must be last
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database first
    const connected = await connectDatabase();
    
    if (!connected) {
      logger.error('Cannot start server without database connection');
      process.exit(1);
    }
    
    // Start listening for requests
    app.listen(PORT, () => {
      logger.info(`API server running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
startServer();

// Export app for testing
export { app };
