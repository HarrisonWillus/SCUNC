const sharp = require('sharp');

const processImage = (options = {}) => {
    const {
        width = 500,
        height = 500,
        quality = 90,
        format = 'jpeg',
        fit = 'cover',
        position = 'center',
        maxFileSize = 5 * 1024 * 1024 // 5MB
    } = options;

    return async (req, res, next) => {
        if (!req.file) {
            console.log('IMAGE PROCESSOR: No file to process, skipping...');
            return next();
        }

        try {
            // Check file size before processing
            if (req.file.size > maxFileSize) {
                console.log('IMAGE PROCESSOR: File too large:', req.file.size, 'bytes');
                return res.status(400).json({ 
                    message: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB` 
                });
            }

            console.log('IMAGE PROCESSOR: Processing uploaded image...');
            console.log('IMAGE PROCESSOR: Original file:', {
                name: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            });

            // Get image metadata
            const metadata = await sharp(req.file.buffer).metadata();
            console.log('IMAGE PROCESSOR: Original dimensions:', `${metadata.width}x${metadata.height}`);

            // Validate it's actually an image
            if (!metadata.width || !metadata.height) {
                console.log('IMAGE PROCESSOR: Invalid image file - no dimensions');
                return res.status(400).json({ 
                    message: 'Invalid image file' 
                });
            }

            let sharpInstance = sharp(req.file.buffer);

            // If making square, crop first using the smaller dimension
            if (width === height) {
                const size = Math.min(metadata.width, metadata.height);
                console.log('IMAGE PROCESSOR: Cropping to square using size:', size);
                sharpInstance = sharpInstance.resize(size, size, {
                    fit: 'cover',
                    position: position
                });
            }

            // Resize to final dimensions
            sharpInstance = sharpInstance.resize(width, height, {
                fit: fit,
                position: position
            });

            // Apply format and quality
            if (format === 'jpeg') {
                sharpInstance = sharpInstance.jpeg({ 
                    quality: quality,
                    progressive: true 
                });
            } else if (format === 'png') {
                sharpInstance = sharpInstance.png({ 
                    quality: quality,
                    progressive: true 
                });
            } else if (format === 'webp') {
                sharpInstance = sharpInstance.webp({ 
                    quality: quality 
                });
            }

            const processedBuffer = await sharpInstance.toBuffer();

            // Update the file object
            const originalSize = req.file.size;
            req.file.buffer = processedBuffer;
            req.file.size = processedBuffer.length;
            req.file.mimetype = `image/${format}`;
            
            // Update filename extension
            const originalName = req.file.originalname;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            req.file.originalname = `${nameWithoutExt}.${format}`;

            console.log('IMAGE PROCESSOR: Processing complete!');
            console.log('IMAGE PROCESSOR: Final dimensions:', `${width}x${height}px`);
            console.log('IMAGE PROCESSOR: Final file size:', req.file.size, 'bytes');
            console.log('IMAGE PROCESSOR: Size reduction:', 
                ((1 - (req.file.size / originalSize)) * 100).toFixed(1) + '%');

            next();
        } catch (error) {
            console.error('IMAGE PROCESSOR: Error processing image:', error);
            return res.status(400).json({ 
                message: 'Error processing image. Please ensure you uploaded a valid image file.',
                error: error.message
            });
        }
    };
};

// Export both the configurable function and a default instance
module.exports = processImage;
module.exports.default = processImage();
