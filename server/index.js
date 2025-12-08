const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS to allow credentials
const allowedOrigins = [
  process.env.CLIENT_URL_DEV, // for local development
  process.env.CLIENT_URL_TEST, // for testing/staging
  process.env.CLIENT_URL_PROD // for production
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // origin === undefined for non-browser requests (curl, server-to-server)
    if (!origin) {
      console.group('🌐 CORS Request');
      console.log('Status: ✅ ALLOWED');
      console.log('Type: Non-browser request (curl, server-to-server)');
      console.log('Origin: undefined');
      console.groupEnd();
      return callback(null, true);
    }

    const allowed = allowedOrigins.includes(origin);
    if (allowed) {
      console.group('🌐 CORS Request');
      console.log('Status: ✅ ALLOWED');
      console.log('Origin:', origin);
      console.log('Matched against allowed origins:', allowedOrigins.length, 'configured');
      console.groupEnd();
      return callback(null, true);
    } else {
      console.group('🚫 CORS Request BLOCKED');
      console.log('Status: ❌ REJECTED');
      console.log('Origin:', origin);
      console.log('Reason: Not in allowed origins list');
      console.log('Allowed origins:', allowedOrigins);
      console.groupEnd();
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Origin', 'Content-Type', 'x-api-key', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

const validateApiKey = require('./middleware/validAPIKey');

app.set('trust proxy', 1); // trust first proxy

app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

app.use(cors(corsOptions));

// Detailed request logging middleware for debugging
app.use((req, res, next) => {
  // Only log API requests (skip static files, etc.)
  if (req.path.startsWith('/api/') || req.path === '/health') {
    console.group('📥 Incoming Request');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Origin:', req.headers.origin || 'none');
    console.log('User-Agent:', req.headers['user-agent'] || 'unknown');
    console.log('API Key Present:', !!req.headers['x-api-key']);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  next();
});

app.use(validateApiKey);

// Import routes
const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const secretariateRoutes = require('./routes/secretariateRoutes');
const committeeRoutes = require('./routes/committeeRoutes');
const emailRoutes = require('./routes/emailRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const hotelRoutes = require('./routes/hotelRoutes');

// Add these middleware BEFORE your routes
app.use(express.json({ limit: '50mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For form data

// Use routes
app.use('/api/auth',  authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/secretariates', secretariateRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/schedule',  scheduleRoutes);
app.use('/api/contact',  emailRoutes);
app.use('/api/quotes',  quoteRoutes);
app.use('/api/hotels',  hotelRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});