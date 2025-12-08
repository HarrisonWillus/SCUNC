function validateApiKey(req, res, next) {
    // Skip API key validation for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    // Skip API key validation for health check endpoint
    if (req.path === '/health') {
        return next();
    }

    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
    }
    next();
}

module.exports = validateApiKey;