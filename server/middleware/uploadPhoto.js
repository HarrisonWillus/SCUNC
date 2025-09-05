const multer = require('multer');

console.log('Step 1: uploadPhoto middleware loaded and initialized');

// Set up storage (memory storage for example)
const storage = multer.memoryStorage();

// File size limit: 50MB
const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes

console.log('Step 2: Multer configuration setup - MAX_SIZE:', MAX_SIZE, 'bytes (', MAX_SIZE / (1024 * 1024), 'MB)');

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
        console.log('Step 3: File filter triggered for incoming file:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size || 'unknown'
        });
        
        // Accept only image files (optional, remove if not needed)
        if (!file.mimetype.startsWith('image/')) {
            console.log('Step 4: File rejected - not an image type. Mimetype:', file.mimetype);
            return cb(new Error('Only image files are allowed!'), false);
        }
        
        console.log('Step 5: File accepted - valid image type confirmed');
        cb(null, true);
    }
});

// Middleware to handle single photo upload with field name 'photo'
const uploadSinglePhoto = (req, res, next) => {
    console.log('Step 6: uploadSinglePhoto middleware function called');
    console.log('Step 7: Request headers analysis:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
    });
    
    upload.single('photo')(req, res, (err) => {
        if (err) {
            console.log('Step 8: Upload error occurred during processing:', {
                name: err.name,
                message: err.message,
                code: err.code,
                field: err.field,
                storageErrors: err.storageErrors
            });
            
            if (err instanceof multer.MulterError) {
                console.log('Step 9: Multer specific error detected - code:', err.code);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    console.log('Step 10: File size exceeds limit. Max size:', MAX_SIZE, 'bytes');
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    console.log('Step 11: Too many files uploaded in request');
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    console.log('Step 12: Unexpected field name detected:', err.field);
                }
            }
            return next(err);
        }
        
        if (req.file) {
            console.log('Step 13: File uploaded successfully with details:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                bufferLength: req.file.buffer ? req.file.buffer.length : 'no buffer'
            });
        } else {
            console.log('Step 14: No file uploaded in request (req.file is undefined)');
        }
        
        console.log('Step 15: Upload middleware processing completed successfully');
        next();
    });
};

module.exports = uploadSinglePhoto;
