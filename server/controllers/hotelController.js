const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

// Get all hotels
exports.getAllHotels = async (req, res) => {
    console.log('hotelController.getAllHotels: Function called - hotel data retrieval request received');
    
    try {
        console.log('hotelController.getAllHotels: Database query execution started for hotel data with amenities');
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
        console.log('hotelController.getAllHotels: Database query successful - retrieved hotel count:', result.rows.length);
        console.log('hotelController.getAllHotels: Hotel data processing completed successfully');
        res.status(200).json({ hotels: result.rows });
    } catch (error) {
        console.error('hotelController.getAllHotels: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllAmenities = async (req, res) => {
    console.log('hotelController.getAllAmenities: Function called - amenities data retrieval request received');
    try {
        console.log('hotelController.getAllAmenities: Database query execution started for amenities');
        const result = await pool.query('SELECT * FROM amenities ORDER BY name ASC');
        console.log('hotelController.getAllAmenities: Database query successful - amenities retrieved');
        res.status(200).json({ amenities: result.rows });
    } catch (error) {
        console.error('hotelController.getAllAmenities: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new hotel
exports.createHotel = async (req, res) => {
    console.log('hotelController.createHotel: Function called - hotel creation request received');
    console.log('hotelController.createHotel: Request data validation initiated');

    const { name, description, image, link , amenities } = req.body;

    if (!name || !description || !image || !amenities || !link) {
        console.log('hotelController.createHotel: Required field validation failed - missing data');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('hotelController.createHotel: Image upload processing workflow initiated');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        
        if (typeof image === 'string') {
            console.log('hotelController.createHotel: Base64 image string processing started');
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('hotelController.createHotel: Original filename extraction successful');
            } else {
                console.log('hotelController.createHotel: No filename found in data URL - using default');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('hotelController.createHotel: Data URL format validation failed');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('hotelController.createHotel: MIME type extraction completed');
            console.log('hotelController.createHotel: Base64 data parsing completed');
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('hotelController.createHotel: Base64 data validation failed - insufficient data');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('hotelController.createHotel: Buffer creation from base64 data successful');
            } catch (bufferError) {
                console.log('hotelController.createHotel: Buffer creation from base64 data failed:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `hotel_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('hotelController.createHotel: Filename assignment completed');
            console.log('hotelController.createHotel: MIME type configuration set');
            console.log('hotelController.createHotel: Buffer validation completed - ready for upload');
        } else if (image && image.buffer) {
            console.log('hotelController.createHotel: File object image processing started');
            imageBuffer = image.buffer;
            fileName = image.originalname || `hotel_${Date.now()}.jpg`;
            mimeType = image.mimetype || 'image/jpeg';
            
            console.log('hotelController.createHotel: File object data extraction completed');
        } else {
            console.log('hotelController.createHotel: Image format validation failed - invalid format');
            throw new Error('Invalid image format');
        }

        console.log('hotelController.createHotel: Supabase storage upload process initiated');
        
        // Debug the buffer before upload
        console.log('hotelController.createHotel: Pre-upload buffer validation completed');
        
        const { data, error } = await supabase.storage
            .from('hotel-images')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('hotelController.createHotel: Supabase upload process failed:', error.message);
            throw error;
        }

        console.log('hotelController.createHotel: Image upload completed successfully');
        console.log('hotelController.createHotel: Public URL generation initiated');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('hotel-images')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        console.log('hotelController.createHotel: Public URL generation completed');
        
        // Test if the file is actually accessible
        try {
            console.log('hotelController.createHotel: File accessibility validation initiated');
            
            // List all files in bucket to see if our file is there
            const { data: listData, error: listError } = await supabase.storage
                .from('hotel-images')
                .list('', { limit: 100 });
            
            if (listError) {
                console.log('hotelController.createHotel: File listing validation failed:', listError.message);
            } else {
                console.log('hotelController.createHotel: Bucket file listing successful');
                const ourFile = listData.find(file => file.name === fileName);
                if (ourFile) {
                    console.log('hotelController.createHotel: Uploaded file found in bucket verification successful');
                } else {
                    console.log('hotelController.createHotel: Uploaded file not found in bucket listing');
                }
            }
            
            // Try to download the file
            const { data: downloadData, error: downloadError } = await supabase.storage
                .from('hotel-images')
                .download(fileName);
            
            if (downloadError) {
                console.log('hotelController.createHotel: File download test failed:', downloadError.message);
            } else {
                console.log('hotelController.createHotel: File download test successful - file accessible');
                
                // Convert to buffer and check first few bytes
                const arrayBuffer = await downloadData.arrayBuffer();
                const downloadedBuffer = Buffer.from(arrayBuffer);
                console.log('hotelController.createHotel: Downloaded buffer validation completed');
                console.log('hotelController.createHotel: Buffer integrity verification completed');
            }
        } catch (testError) {
            console.log('hotelController.createHotel: File accessibility test error:', testError.message);
        }

        console.log('hotelController.createHotel: Database hotel insertion initiated');
        const result = await pool.query(
            'INSERT INTO hotels (name, description, picture_url, hotel_link) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, publicUrl, link]
        );

        const hotelId = result.rows[0].id;
        console.log('hotelController.createHotel: Hotel database insertion successful - ID:', hotelId);

        // Insert each amenity as a separate row
        if (amenities && Array.isArray(amenities) && amenities.length > 0) {
            console.log('hotelController.createHotel: Amenities processing initiated - count:', amenities.length);
            for (let i = 0; i < amenities.length; i++) {
                const amenity = amenities[i];
                console.log('hotelController.createHotel: Processing amenity:', i + 1, 'of', amenities.length);
                await pool.query(
                    'INSERT INTO hotel_extras (hotel_id, info) VALUES ($1, $2)',
                    [hotelId, amenity]
                );
            }
            console.log('hotelController.createHotel: All amenities inserted successfully');
        } else {
            console.log('hotelController.createHotel: No amenities provided or invalid format');
        }

        console.log('hotelController.createHotel: Function completed successfully - hotel created');
        
        // Fetch all hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(201).json({ hotels: allHotels.rows, message: 'Hotel created successfully' });
    } catch (error) {
        console.error('hotelController.createHotel: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a hotel
exports.updateHotel = async (req, res) => {
    console.log('hotelController.updateHotel: Function called - hotel update request received');
    
    const { id } = req.params;
    const { name, description, image, link, amenities, amenities_id } = req.body;

    try {
        // First, get the current record to compare with new data
        console.log('hotelController.updateHotel: Current record retrieval for comparison initiated');
        const currentRecord = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
        const currentamenitiesRecord = await pool.query('SELECT * FROM hotel_amenities WHERE id = $1', [amenities_id]);

        if (currentRecord.rows.length === 0 || currentamenitiesRecord.rows.length === 0) {
            console.log('hotelController.updateHotel: Hotel record not found for ID:', id);
            return res.status(404).json({ message: 'Hotel not found' });
        }

        const current = currentRecord.rows[0];
        const currentamenities = currentamenitiesRecord.rows[0];
        console.log('hotelController.updateHotel: Current record data retrieved successfully');

        // Build update fields and values dynamically based on what's actually changed
        const updateFields = [];
        const updateValues = [];
        let valueIndex = 1;

        // Check and update name if it's different
        if (name && name.trim() !== current.name) {
            console.log('hotelController.updateHotel: Name field update detected');
            updateFields.push(`name = $${valueIndex}`);
            updateValues.push(name.trim());
            valueIndex++;
        } else {
            console.log('hotelController.updateHotel: Name field unchanged - keeping existing value');
        }

        // Check and update description if it's different
        if (description && description.trim() !== current.description) {
            console.log('hotelController.updateHotel: Description field update detected');
            updateFields.push(`description = $${valueIndex}`);
            updateValues.push(description.trim());
            valueIndex++;
        } else {
            console.log('hotelController.updateHotel: Description field unchanged - keeping existing value');
        }

        // Check and update link if it's different
        if (link !== undefined && link !== current.link) {
            console.log('hotelController.updateHotel: Link field update detected');
            updateFields.push(`link = $${valueIndex}`);
            updateValues.push(link);
            valueIndex++;
        } else {
            console.log('hotelController.updateHotel: Link field unchanged - keeping existing value');
        }

        if (amenities !== undefined && amenities !== currentamenities.info) {
            updateFields.push(`info = $${valueIndex}`);
            updateValues.push(amenities);
            valueIndex++;
        }

        // Handle image upload only if new image is provided
        let newPublicUrl = null;
        if (image && image !== current.image_url) {
            console.log('hotelController.updateHotel: New image upload processing initiated');
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            if (typeof image === 'string') {
                console.log('hotelController.updateHotel: Base64 image string processing started');
                
                // Extract filename from data URL if present
                let originalFilename = null;
                const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
                if (nameMatch) {
                    originalFilename = decodeURIComponent(nameMatch[1]);
                    console.log('hotelController.updateHotel: Original filename extraction successful');
                } else {
                    console.log('hotelController.updateHotel: No filename found in data URL');
                }
                
                // Check if the data URL is properly formatted
                const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!dataUrlMatch) {
                    console.log('hotelController.updateHotel: Data URL format validation failed');
                    throw new Error('Invalid base64 data URL format');
                }
                
                const mimeTypeFromUrl = dataUrlMatch[1];
                const base64Data = dataUrlMatch[3];
                
                console.log('hotelController.updateHotel: MIME type extraction completed');
                console.log('hotelController.updateHotel: Base64 data parsing completed');
                
                // Validate base64 data
                if (!base64Data || base64Data.length < 100) {
                    console.log('hotelController.updateHotel: Base64 data validation failed');
                    throw new Error('Invalid base64 image data');
                }
                
                try {
                    imageBuffer = Buffer.from(base64Data, 'base64');
                    console.log('hotelController.updateHotel: Buffer creation successful');
                } catch (bufferError) {
                    console.log('hotelController.updateHotel: Buffer creation failed:', bufferError.message);
                    throw new Error('Failed to process base64 image data');
                }
                
                // Use exact original filename or fallback
                fileName = originalFilename || `hotel_${Date.now()}.jpg`;
                mimeType = mimeTypeFromUrl || 'image/jpeg';
                
                console.log('hotelController.updateHotel: Filename and MIME type configuration completed');
            } else if (image && image.buffer) {
                console.log('hotelController.updateHotel: File object image processing started');
                imageBuffer = image.buffer;
                fileName = image.originalname || `hotel_${Date.now()}.jpg`;
                mimeType = image.mimetype || 'image/jpeg';
                
                console.log('hotelController.updateHotel: File object data extraction completed');
            } else {
                console.log('hotelController.updateHotel: Image format validation failed');
                throw new Error('Invalid image format');
            }

            console.log('hotelController.updateHotel: Supabase storage upload initiated');
            const { data, error } = await supabase.storage
                .from('hotel-images')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('hotelController.updateHotel: Supabase upload failed:', error.message);
                throw error;
            }

            console.log('hotelController.updateHotel: New image upload completed successfully');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('hotel-images')
                .getPublicUrl(fileName);

            newPublicUrl = publicUrlData.publicUrl;
            console.log('hotelController.updateHotel: New public URL generation completed');
            
            updateFields.push(`image_url = $${valueIndex}`);
            updateValues.push(newPublicUrl);
            valueIndex++;
        } else {
            console.log('hotelController.updateHotel: No new image provided - keeping existing image');
        }

        // Check if any fields need to be updated
        if (updateFields.length === 0) {
            console.log('hotelController.updateHotel: No changes detected - returning current data');
            const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
            return res.status(200).json({ hotels: allHotels.rows, message: 'No changes detected' });
        }

        // Always update the updated_at timestamp when any field changes
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // Add the ID parameter for the WHERE clause
        updateValues.push(id);
        const whereClauseIndex = valueIndex;

        const updateQuery = `UPDATE hotels SET ${updateFields.join(', ')} WHERE id = $${whereClauseIndex} RETURNING *`;
        
        console.log('hotelController.updateHotel: Database update query execution initiated');
        
        const result = await pool.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
            console.log('hotelController.updateHotel: Hotel not found after update attempt');
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('hotelController.updateHotel: Hotel update completed successfully');
        
        // Fetch all hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(200).json({ hotels: allHotels.rows, message: 'Hotel updated successfully' });
    } catch (error) {
        console.error('hotelController.updateHotel: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a hotel
exports.deleteHotel = async (req, res) => {
    console.log('hotelController.deleteHotel: Function called - hotel deletion request received');
    
    const { id } = req.params;

    try {
        console.log('hotelController.deleteHotel: Database hotel deletion initiated');
        const result = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            console.log('hotelController.deleteHotel: Hotel not found for deletion - ID:', id);
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('hotelController.deleteHotel: Hotel deletion completed successfully');
        
        // Fetch all remaining hotels with proper ordering
        const allHotels = await pool.query('SELECT * FROM hotels ORDER BY created_at ASC');
        res.status(200).json({ hotels: allHotels.rows, message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('hotelController.deleteHotel: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a single hotel by ID
exports.getHotelById = async (req, res) => {
    console.log('hotelController.getHotelById: Function called - single hotel retrieval request received');
    
    const { id } = req.params;

    try {
        console.log('hotelController.getHotelById: Database hotel query initiated for ID:', id);
        const result = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            console.log('hotelController.getHotelById: Hotel not found for ID:', id);
            return res.status(404).json({ message: 'Hotel not found' });
        }

        console.log('hotelController.getHotelById: Hotel data retrieval successful');
        res.status(200).json({ hotel: result.rows[0] });
    } catch (error) {
        console.error('hotelController.getHotelById: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};