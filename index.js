require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const setupSwaggerDocs = require('./config/swaggerUiConfig');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Ensure required environment variables are set
if (!process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS environment variable is required');
}

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // If the origin is empty (i.e., no Origin header present)
    if (!origin) {
      // Only allow certain HTTP methods and specific headers for no-origin requests
      const allowedMethodsForNoOrigin = ['GET', 'POST']; // Only allow safe methods
      const allowedHeadersForNoOrigin = ['sprintsync-api-key', 'Authorization']; // Custom headers for auth

      // Check the request method and headers for security
      if (
        allowedMethodsForNoOrigin.includes(req.method) &&
        (req.headers['sprintsync-api-key'] || req.headers['Authorization'])
      ) {
        return callback(null, true); // Allow the request
      } else {
        return callback(new Error('CORS policy does not allow empty origin requests without proper authentication'), false);
      }
    }

    // Regular origin checks for requests with Origin header
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from origin: ' + origin), false);
    }
  },
  credentials: true, // Allow cookies/headers if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Restrict methods to reduce attack surface
  allowedHeaders: ['Content-Type', 'Authorization', 'sprintsync-api-key', 'x-requested-with'], // Limit allowed headers
  preflightContinue: false, // Don't pass the preflight to the next handler
  optionsSuccessStatus: 204 // For legacy browser support
};

// Use CORS middleware
app.use(cors(corsOptions));

// Security: Set HTTP headers to protect the app (e.g., against XSS, clickjacking, etc.)
app.use(helmet());

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
