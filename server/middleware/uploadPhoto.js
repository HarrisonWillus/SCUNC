const multer = require('multer');

console.log('[DEBUG] uploadPhoto middleware loaded');

// Set up storage (memory storage for example)
const storage = multer.memoryStorage();

// File size limit: 50MB
const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes

console.log('[DEBUG] Multer configuration - MAX_SIZE:', MAX_SIZE, 'bytes (', MAX_SIZE / (1024 * 1024), 'MB)');

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
        console.log('[DEBUG] File filter triggered for file:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size || 'unknown'
        });
        
        // Accept only image files (optional, remove if not needed)
        if (!file.mimetype.startsWith('image/')) {
            console.log('[DEBUG] File rejected - not an image. Mimetype:', file.mimetype);
            return cb(new Error('Only image files are allowed!'), false);
        }
        
        console.log('[DEBUG] File accepted - valid image type');
        cb(null, true);
    }
});

// Middleware to handle single photo upload with field name 'photo'
const uploadSinglePhoto = (req, res, next) => {
    console.log('[DEBUG] uploadSinglePhoto middleware called');
    console.log('[DEBUG] Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
    });
    
    upload.single('photo')(req, res, (err) => {
        if (err) {
            console.log('[DEBUG] Upload error occurred:', {
                name: err.name,
                message: err.message,
                code: err.code,
                field: err.field,
                storageErrors: err.storageErrors
            });
            
            if (err instanceof multer.MulterError) {
                console.log('[DEBUG] Multer specific error - code:', err.code);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    console.log('[DEBUG] File too large. Max size:', MAX_SIZE, 'bytes');
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    console.log('[DEBUG] Too many files uploaded');
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    console.log('[DEBUG] Unexpected field name:', err.field);
                }
            }
            return next(err);
        }
        
        if (req.file) {
            console.log('[DEBUG] File uploaded successfully:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                bufferLength: req.file.buffer ? req.file.buffer.length : 'no buffer'
            });
        } else {
            console.log('[DEBUG] No file uploaded (req.file is undefined)');
        }
        
        console.log('[DEBUG] Upload middleware completed successfully');
        next();
    });
};

module.exports = uploadSinglePhoto;
