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
      console.log(`CORS: no origin (non-browser request) — allowing`);
      return callback(null, true);
    }

    const allowed = allowedOrigins.includes(origin);
    if (allowed) {
      console.log(`CORS: allowing origin ${origin}`);
      return callback(null, true);
    } else {
      console.warn(`CORS: rejecting origin ${origin}`);
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