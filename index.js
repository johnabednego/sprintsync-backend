require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const customCors = require('./middlewares/customCors');
const connectDB = require('./config/db');
const setupSwaggerDocs = require('./config/swaggerUiConfig');


// Initialize app
const app = express();

// Security: Set HTTP headers to protect the app (e.g., against XSS, clickjacking, etc.)
app.use(helmet());

// Connect to database
connectDB();

// Ensure required environment variables are set
if (!process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS environment variable is required');
}

// Use CORS middleware
app.use(customCors);

// Routes here



// Body parsing middleware
// Limit the size of incoming JSON requests to prevent large payloads from being sent
app.use(express.json({ limit: '10mb' }));

// Swagger docs setup (ensure it's only exposed in non-production environments)
if (process.env.NODE_ENV !== 'production') {
  setupSwaggerDocs(app);
}

// Add a basic logging middleware for request logging (use Winston or Morgan in real apps)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Example of a route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Graceful shutdown to handle termination signals and close DB connections gracefully
process.on('SIGINT', () => {
  console.log('Gracefully shutting down...');
  app.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0); // Exit the process cleanly
  });
});

// Catching uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit the process with failure code
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit the process with failure code
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
