const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS to allow credentials
const corsOptions = {
  origin: process.env.CLIENT_URL, // React production build URL
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
};

const validateApiKey = require('./middleware/validAPIKey');

app.use((req, res, next) => {
    if (req.headers['x-forwarded-for'] && !app.get('trust proxy')) {
        app.set('trust proxy', 1);
        console.log('✅ Auto-enabled trust proxy due to X-Forwarded-For header');
    }
    next();
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