const processImage = require('./middleware/imageProcessor');
const sharp = require('sharp');

// Simple test to verify image processing works
async function testImageProcessing() {
    console.log('🧪 Testing image processing middleware...');
    
    // Create a simple test image buffer (100x200 rectangle)
    const testBuffer = await sharp({
        create: {
            width: 100,
            height: 200,
            channels: 3,
            background: { r: 255, g: 0, b: 0 }
        }
    }).jpeg().toBuffer();
    
    // Mock request object
    const req = {
        file: {
            fieldname: 'photo',
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
            size: testBuffer.length,
            buffer: testBuffer
        }
    };
    
    // Mock response object
    const res = {
        status: function() { return this; },
        json: function() {}
    };
    
    // Create image processor with default settings (500x500)
    const processor = processImage();
    
    // Process the image
    await processor(req, res, () => {
        console.log('✅ Image processing completed!');
        console.log('📏 Original size:', testBuffer.length, 'bytes');
        console.log('📏 Processed size:', req.file.size, 'bytes');
        console.log('📐 Final mimetype:', req.file.mimetype);
        console.log('📁 Final filename:', req.file.originalname);
    });
    
    // Verify the processed image is square
    const processedMetadata = await sharp(req.file.buffer).metadata();
    console.log('📐 Final dimensions:', `${processedMetadata.width}x${processedMetadata.height}`);
    
    if (processedMetadata.width === 500 && processedMetadata.height === 500) {
        console.log('🎉 SUCCESS: Image is now perfectly square (500x500)!');
    } else {
        console.log('❌ ERROR: Image dimensions are not correct');
    }
}

if (require.main === module) {
    testImageProcessing().catch(console.error);
}

module.exports = testImageProcessing;
