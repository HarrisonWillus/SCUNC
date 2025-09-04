const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

// Get all hotels
exports.getAllHotels = async (req, res) => {
    console.log('🏨 HOTELS: Get all hotels request received');
    
    try {
        console.log('💾 HOTELS: Fetching from database...');
        const result = await pool.query(`
            SELECT 
                h.id,
                h.name,
                h.description,
                h.picture_url,
                h.hotel_link,
                COALESCE(
                    JSON_AGG(
                        CASE 
                            WHEN he.info IS NOT NULL THEN he.info 
                            ELSE NULL 
                        END
                    ) FILTER (WHERE he.info IS NOT NULL), 
                    '[]'::json
                ) AS amenities
            FROM hotels h 
            LEFT JOIN hotel_extras he ON h.id = he.hotel_id 
            GROUP BY h.id, h.name, h.description, h.picture_url, h.hotel_link
            ORDER BY h.created_at ASC
        `);
        console.log('✅ HOTELS: Found', result.rows.length, 'hotels');
        console.log('📋 HOTELS: Sample data structure:', result.rows[0] ? {
            id: result.rows[0].id,
            name: result.rows[0].name,
            has_amenities: !!result.rows[0].amenities,
            amenities_count: Array.isArray(result.rows[0].amenities) ? result.rows[0].amenities.length : 0,
            amenities_sample: result.rows[0].amenities
        } : 'No hotels found');
        res.status(200).json({ hotels: result.rows });
    } catch (error) {
        console.error('💥 HOTELS: Error fetching hotels:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllAmenities = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM amenities ORDER BY name ASC');
        res.status(200).json({ amenities: result.rows });
    } catch (error) {
        console.error('💥 AMENITIES: Error fetching amenities:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new hotel
exports.createHotel = async (req, res) => {
    console.log('🏨 HOTELS: Create hotel request received');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('🏷️ Name:', req.body.name);
    console.log('📄 Description length:', req.body.description ? req.body.description.length : 0);
    console.log('🖼️ Image provided:', !!req.body.image);
    console.log('🖼️ Image type:', typeof req.body.image);
    console.log('🔗 Link provided:', !!req.body.link);
    console.log('📝 amenities length:', req.body.amenities ? req.body.amenities.length : 0);

    const { name, description, image, link , amenities } = req.body;

    if (!name || !description || !image || !amenities || !link) {
        console.log('❌ HOTELS: Missing required fields');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('☁️ HOTELS: Processing image upload...');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        
        if (typeof image === 'string') {
            console.log('📝 HOTELS: Image is base64 string, processing...');
            console.log('🔍 HOTELS: Raw image string length:', image.length);
            console.log('🔍 HOTELS: Image string start (first 150 chars):', image.substring(0, 150));
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('📁 HOTELS: Original filename found:', originalFilename);
            } else {
                console.log('⚠️ HOTELS: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('❌ HOTELS: Invalid data URL format');
                console.log('🔍 HOTELS: Expected format: data:mime/type;name=filename;base64,data');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('🎯 HOTELS: Extracted MIME type:', mimeTypeFromUrl);
            console.log('🎯 HOTELS: Base64 data length:', base64Data.length);
            console.log('🎯 HOTELS: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('❌ HOTELS: Base64 data is too short or empty');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('✅ HOTELS: Buffer created successfully');
            } catch (bufferError) {
                console.log('❌ HOTELS: Failed to create buffer from base64:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `hotel_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('   - Using filename:', fileName);
            console.log('   - MIME type:', mimeType);
            console.log('   - Buffer size:', imageBuffer.length);
            console.log('   - Buffer is valid:', imageBuffer && imageBuffer.length > 0);
        } else if (image && image.buffer) {
            console.log('📁 HOTELS: Image is file object, processing...');
            imageBuffer = image.buffer;
            fileName = image.originalname || `hotel_${Date.now()}.jpg`;
            mimeType = image.mimetype || 'image/jpeg';
            
            console.log('   - Original filename:', fileName);
            console.log('   - MIME type:', mimeType);
            console.log('   - Buffer size:', imageBuffer.length);
        } else {
            console.log('❌ HOTELS: Invalid image format');
            throw new Error('Invalid image format');
        }

        console.log('☁️ HOTELS: Uploading to Supabase storage...');
        
        // Debug the buffer before upload
        console.log('🔍 HOTELS: Pre-upload buffer validation:');
        console.log('   - Buffer length:', imageBuffer.length);
        console.log('   - Buffer start (hex):', imageBuffer.slice(0, 20).toString('hex'));
        console.log('   - Is valid JPEG header:', imageBuffer.slice(0, 3).toString('hex') === 'ffd8ff');
        
        const { data, error } = await supabase.storage
            .from('hotel-images')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('❌ HOTELS: Supabase upload error:', error.message);
            console.log('🔍 HOTELS: Full error object:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ HOTELS: Image uploaded successfully');
        console.log('📊 HOTELS: Upload response data:', data);
        console.log('🔗 HOTELS: Getting public URL...');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('hotel-images')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        console.log('🔗 Public URL:', publicUrl);
        
        // Test if the file is actually accessible
        try {
            console.log('🧪 HOTELS: Testing file accessibility...');
            
            // List all files in bucket to see if our file is there
            const { data: listData, error: listError } = await supabase.storage
                .from('hotel-images')
                .list('', { limit: 100 });
            
            if (listError) {
                console.log('❌ HOTELS: Failed to list files:', listError.message);
            } else {
                console.log('📁 HOTELS: Files in bucket:', listData.map(file => `${file.name} (${file.metadata?.size || 'unknown size'})`));
                const ourFile = listData.find(file => file.name === fileName);
                if (ourFile) {
                    console.log('✅ HOTELS: Our file found in bucket:', ourFile);
                } else {
                    console.log('❌ HOTELS: Our file NOT found in bucket listing');
                }
            }
            
            // Try to download the file
            const { data: downloadData, error: downloadError } = await supabase.storage
                .from('hotel-images')
                .download(fileName);
            
            if (downloadError) {
                console.log('⚠️ HOTELS: File download test failed:', downloadError.message);
            } else {
                console.log('✅ HOTELS: File is accessible, size:', downloadData.size);
                console.log('🔍 HOTELS: Downloaded file type:', downloadData.type);
                
                // Convert to buffer and check first few bytes
                const arrayBuffer = await downloadData.arrayBuffer();
                const downloadedBuffer = Buffer.from(arrayBuffer);
                console.log('🔍 HOTELS: Downloaded buffer start (hex):', downloadedBuffer.slice(0, 20).toString('hex'));
                console.log('🔍 HOTELS: Downloaded vs uploaded match:', downloadedBuffer.equals(imageBuffer));
            }
        } catch (testError) {
            console.log('⚠️ HOTELS: File accessibility test error:', testError.message);
        }

        console.log('💾 HOTELS: Inserting into database...');
        const result = await pool.query(
            'INSERT INTO hotels (name, description, picture_url, hotel_link) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, publicUrl, link]
        );

        const hotelId = result.rows[0].id;
        console.log('✅ HOTELS: Hotel created with ID:', hotelId);

        // Insert each amenity as a separate row
        if (amenities && Array.isArray(amenities) && amenities.length > 0) {
            console.log('📝 HOTELS: Inserting', amenities.length, 'amenities...');
            for (let i = 0; i < amenities.length; i++) {
                const amenity = amenities[i];
                console.log(`   - Amenity ${i + 1}:`, amenity);
                await pool.query(
                    'INSERT INTO hotel_extras (hotel_id, info) VALUES ($1, $2)',
                    [hotelId, amenity]
                );
            }
            console.log('✅ HOTELS: All amenities inserted successfully');
        } else {
            console.log('⚠️ HOTELS: No amenities provided or invalid amenities format');
        }

        console.log('✅ HOTELS: Created successfully with ID:', hotelId);
        
        // Fetch all hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(201).json({ hotels: allHotels.rows, message: 'Hotel created successfully' });
    } catch (error) {
        console.error('💥 HOTELS: Error creating hotel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a hotel
exports.updateHotel = async (req, res) => {
    console.log('🏨 HOTELS: Update hotel request received');
    console.log('🆔 ID:', req.params.id);
    console.log('🏷️ Name:', req.body.name);
    console.log('📄 Description length:', req.body.description ? req.body.description.length : 0);
    console.log('🖼️ New image provided:', !!req.body.image);
    console.log('🖼️ Image type:', typeof req.body.image);
    console.log('🔗 Link:', req.body.link);
    
    const { id } = req.params;
    const { name, description, image, link, amenities, amenities_id } = req.body;

    try {
        // First, get the current record to compare with new data
        console.log('🔍 HOTELS: Fetching current record for comparison...');
        const currentRecord = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
        const currentamenitiesRecord = await pool.query('SELECT * FROM hotel_amenities WHERE id = $1', [amenities_id]);

        if (currentRecord.rows.length === 0 || currentamenitiesRecord.rows.length === 0) {
            console.log('❌ HOTELS: Hotel with ID', id, 'not found');
            return res.status(404).json({ message: 'Hotel not found' });
        }

        const current = currentRecord.rows[0];
        const currentamenities = currentamenitiesRecord.rows[0];
        console.log('📋 HOTELS: Current record:', {
            name: current.name,
            description: current.description ? `${current.description.length} chars` : 'NULL',
            image_url: current.image_url,
            link: current.link,
        });

        // Build update fields and values dynamically based on what's actually changed
        const updateFields = [];
        const updateValues = [];
        let valueIndex = 1;

        // Check and update name if it's different
        if (name && name.trim() !== current.name) {
            console.log('🔄 HOTELS: Name changed from', `"${current.name}"`, 'to', `"${name.trim()}"`);
            updateFields.push(`name = $${valueIndex}`);
            updateValues.push(name.trim());
            valueIndex++;
        } else {
            console.log('✓ HOTELS: Name unchanged, keeping existing value');
        }

        // Check and update description if it's different
        if (description && description.trim() !== current.description) {
            console.log('🔄 HOTELS: Description changed from', `${current.description ? current.description.length : 0} chars`, 'to', `${description.trim().length} chars`);
            updateFields.push(`description = $${valueIndex}`);
            updateValues.push(description.trim());
            valueIndex++;
        } else {
            console.log('✓ HOTELS: Description unchanged, keeping existing value');
        }

        // Check and update link if it's different
        if (link !== undefined && link !== current.link) {
            console.log('🔄 HOTELS: Link changed from', current.link || 'NULL', 'to', link || 'NULL');
            updateFields.push(`link = $${valueIndex}`);
            updateValues.push(link);
            valueIndex++;
        } else {
            console.log('✓ HOTELS: Link unchanged, keeping existing value');
        }

        if (amenities !== undefined && amenities !== currentamenities.info) {
            updateFields.push(`info = $${valueIndex}`);
            updateValues.push(amenities);
            valueIndex++;
        }

        // Handle image upload only if new image is provided
        let newPublicUrl = null;
        if (image && image !== current.image_url) {
            console.log('☁️ HOTELS: Processing new image upload...');
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            if (typeof image === 'string') {
                console.log('📝 HOTELS: Image is base64 string, processing...');
                console.log('🔍 HOTELS: Raw image string length:', image.length);
                console.log('🔍 HOTELS: Image string start (first 150 chars):', image.substring(0, 150));
                
                // Extract filename from data URL if present
                let originalFilename = null;
                const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
                if (nameMatch) {
                    originalFilename = decodeURIComponent(nameMatch[1]);
                    console.log('📁 HOTELS: Original filename found:', originalFilename);
                } else {
                    console.log('⚠️ HOTELS: No filename found in data URL');
                }
                
                // Check if the data URL is properly formatted
                const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!dataUrlMatch) {
                    console.log('❌ HOTELS: Invalid data URL format');
                    console.log('🔍 HOTELS: Expected format: data:mime/type;name=filename;base64,data');
                    throw new Error('Invalid base64 data URL format');
                }
                
                const mimeTypeFromUrl = dataUrlMatch[1];
                const base64Data = dataUrlMatch[3];
                
                console.log('🎯 HOTELS: Extracted MIME type:', mimeTypeFromUrl);
                console.log('🎯 HOTELS: Base64 data length:', base64Data.length);
                console.log('🎯 HOTELS: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
                
                // Validate base64 data
                if (!base64Data || base64Data.length < 100) {
                    console.log('❌ HOTELS: Base64 data is too short or empty');
                    throw new Error('Invalid base64 image data');
                }
                
                try {
                    imageBuffer = Buffer.from(base64Data, 'base64');
                    console.log('✅ HOTELS: Buffer created successfully');
                } catch (bufferError) {
                    console.log('❌ HOTELS: Failed to create buffer from base64:', bufferError.message);
                    throw new Error('Failed to process base64 image data');
                }
                
                // Use exact original filename or fallback
                fileName = originalFilename || `hotel_${Date.now()}.jpg`;
                mimeType = mimeTypeFromUrl || 'image/jpeg';
                
                console.log('   - Using filename:', fileName);
                console.log('   - MIME type:', mimeType);
                console.log('   - Buffer size:', imageBuffer.length);
                console.log('   - Buffer is valid:', imageBuffer && imageBuffer.length > 0);
            } else if (image && image.buffer) {
                console.log('📁 HOTELS: Image is file object, processing...');
                imageBuffer = image.buffer;
                fileName = image.originalname || `hotel_${Date.now()}.jpg`;
                mimeType = image.mimetype || 'image/jpeg';
                
                console.log('   - Original filename:', fileName);
                console.log('   - MIME type:', mimeType);
                console.log('   - Buffer size:', imageBuffer.length);
            } else {
                console.log('❌ HOTELS: Invalid image format');
                throw new Error('Invalid image format');
            }

            console.log('☁️ HOTELS: Uploading to Supabase storage...');
            const { data, error } = await supabase.storage
                .from('hotel-images')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('❌ HOTELS: Supabase upload error:', error.message);
                throw error;
            }

            console.log('✅ HOTELS: New image uploaded successfully');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('hotel-images')
                .getPublicUrl(fileName);

            newPublicUrl = publicUrlData.publicUrl;
            console.log('🔗 New Public URL:', newPublicUrl);
            console.log('🔄 HOTELS: Image URL changed from', current.image_url ? 'existing URL' : 'NULL', 'to new URL');
            
            updateFields.push(`image_url = $${valueIndex}`);
            updateValues.push(newPublicUrl);
            valueIndex++;
        } else {
            console.log('✓ HOTELS: No new image provided, keeping existing image');
        }

        // Check if any fields need to be updated
        if (updateFields.length === 0) {
            console.log('ℹ️ HOTELS: No changes detected, returning current data without database update');
            const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
            return res.status(200).json({ hotels: allHotels.rows, message: 'No changes detected' });
        }

        // Always update the updated_at timestamp when any field changes
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // Add the ID parameter for the WHERE clause
        updateValues.push(id);
        const whereClauseIndex = valueIndex;

        const updateQuery = `UPDATE hotels SET ${updateFields.join(', ')} WHERE id = $${whereClauseIndex} RETURNING *`;
        
        console.log('💾 HOTELS: Executing update query...');
        console.log('📋 HOTELS: Query:', updateQuery);
        console.log('📋 HOTELS: Values:', updateValues);
        
        const result = await pool.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
            console.log('❌ HOTELS: Hotel with ID', id, 'not found after update');
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('✅ HOTELS: Updated successfully');
        console.log('📋 HOTELS: Updated hotel data:', result.rows[0]);
        
        // Fetch all hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(200).json({ hotels: allHotels.rows, message: 'Hotel updated successfully' });
    } catch (error) {
        console.error('💥 HOTELS: Error updating hotel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a hotel
exports.deleteHotel = async (req, res) => {
    console.log('🏨 HOTELS: Delete hotel request received');
    console.log('🆔 ID:', req.params.id);
    
    const { id } = req.params;

    try {
        console.log('💾 HOTELS: Deleting from database...');
        const result = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            console.log('❌ HOTELS: Hotel with ID', id, 'not found');
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('✅ HOTELS: Deleted successfully');
        console.log('📋 HOTELS: Deleted hotel data:', result.rows[0]);
        
        // Fetch all remaining hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(200).json({ hotels: allHotels.rows, message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('💥 HOTELS: Error deleting hotel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a single hotel by ID
exports.getHotelById = async (req, res) => {
    console.log('🏨 HOTELS: Get hotel by ID request received');
    console.log('🆔 ID:', req.params.id);
    
    const { id } = req.params;

    try {
        console.log('💾 HOTELS: Fetching from database...');
        const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            console.log('❌ HOTELS: Hotel with ID', id, 'not found');
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('✅ HOTELS: Found hotel:', result.rows[0].name);
        res.status(200).json({ hotel: result.rows[0] });
    } catch (error) {
        console.error('💥 HOTELS: Error fetching hotel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};