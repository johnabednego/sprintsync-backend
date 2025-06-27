require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const customCors = require('./middleware/customCors');
const connectDB = require('./config/db');
const setupSwaggerDocs = require('./config/swaggerUiConfig');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const commentRoutes = require('./routes/commentRoutes');


// Initialize app
const app = express();

// Security headers
app.use(helmet());

// Connect to MongoDB
connectDB();

// CORS
if (!process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS environment variable is required');
}
app.use(customCors);

// HTTP request logging with Morgan
// 'combined' gives us Apache-style logs whiles 'dev' gives us a concise colored output
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Swagger docs (non-production only)
if (process.env.NODE_ENV !== 'production') {
  setupSwaggerDocs(app);
}

// Mount user routes
app.use('/api/users', userRoutes);
// Mount auth routes
app.use('/api/auth', authRoutes);
// Mount task routes
app.use('/api/task', taskRoutes);
// Mount project routes
app.use('/api/project', projectRoutes);
// Mount timeEntry routes
app.use('/api/time-entries', timeEntryRoutes);
// Mount comment routes
app.use('/api/comments', commentRoutes);


// Example root route
app.get('/', (req, res) => {
  res.send('Server is Up and Running!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Gracefully shutting down...');
  app.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
