const cors = require('cors');

// Load allowed origins from .env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions = {
  origin: true, // Let our middleware handle validation
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'sprintsync-api-key', 'x-requested-with'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const customCors = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    // Handle curl, Postman, or same-origin requests
    const allowedMethods = ['GET', 'POST'];
    const hasAuthHeader = req.headers['sprintsync-api-key'] || req.headers['authorization'];

    if (
      allowedMethods.includes(req.method) &&
      hasAuthHeader
    ) {
      return cors(corsOptions)(req, res, next);
    } else {
      return res.status(403).json({
        message: 'CORS policy does not allow empty origin requests without proper authentication',
      });
    }
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      message: `CORS policy does not allow access from origin: ${origin}`,
    });
  }

  return cors({ ...corsOptions, origin: origin })(req, res, next);
};

module.exports = customCors;
