const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

// Get all committees with topics
exports.getAllCommittees = async (req, res) => {
    console.log('🔵 getAllCommittees - Function started');
    console.log('📥 getAllCommittees - Request received from:', req.ip || 'unknown IP');
    
    try {
        console.log('🗄️ getAllCommittees - Executing database query to fetch all committees with topics');
        const result = await pool.query(`SELECT c.*, 
                                        cat.title as category_title, 
                                        cat.id AS category_id,
                                        COALESCE(
                                            json_agg(
                                                CASE WHEN t.id IS NOT NULL THEN
                                                    json_build_object('id', t.id, 'topic', t.topic)
                                                END
                                            ) FILTER (WHERE t.id IS NOT NULL),
                                            '[]'::json
                                        ) as topics
                                        FROM committees c
                                        LEFT JOIN categories cat ON c.category_id = cat.id
                                        LEFT JOIN committee_topics t ON c.id = t.committee_id
                                        GROUP BY c.id, cat.id, cat.title
                                        ORDER BY c.order_num ASC, c.created_at ASC`);
        
        console.log('✅ getAllCommittees - Database query successful');
        console.log('📊 getAllCommittees - Retrieved', result.rows.length, 'committees');
        console.log('📋 getAllCommittees - Committee data preview:', result.rows.map(c => ({ id: c.id, title: c.title, category: c.category_title })));
        
        console.log('🔵 getAllCommittees - Function completed successfully');
        res.status(200).json({ committees: result.rows });
    } catch (error) {
        console.error('❌ getAllCommittees - Database error occurred:', error.message);
        console.error('📍 getAllCommittees - Error stack:', error.stack);
        console.error('🔴 getAllCommittees - Function failed');
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    console.log('🔵 getCategories - Function started');
    console.log('📥 getCategories - Request received from:', req.ip || 'unknown IP');
    
    try {
        console.log('🗄️ getCategories - Executing database query to fetch all categories');
        const result = await pool.query('SELECT * FROM categories ORDER BY title ASC');
        
        console.log('✅ getCategories - Database query successful');
        console.log('📊 getCategories - Retrieved', result.rows.length, 'categories');
        console.log('📋 getCategories - Categories:', result.rows.map(c => ({ id: c.id, title: c.title })));
        
        console.log('🔵 getCategories - Function completed successfully');
        res.status(200).json({ categories: result.rows });
    } catch (error) {
        console.error('❌ getCategories - Database error occurred:', error.message);
        console.error('📍 getCategories - Error stack:', error.stack);
        console.error('🔴 getCategories - Function failed');
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new committee
exports.createCommittee = async (req, res) => {
    console.log('📝 COMMITTEES: Create committee request received');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('🏷️ Name:', req.body.title);
    console.log('🏢 Category ID:', req.body.category_id);
    console.log('📄 Description length:', req.body.description ? req.body.description.length : 0);
    console.log('🖼️ Image provided:', !!req.body.image);
    console.log('🖼️ Image type:', typeof req.body.image);
    console.log('🖼️ Image value (first 100 chars):', req.body.image ? req.body.image.substring(0, 100) + '...' : null);
    console.log('✉️ Background guide:', req.body.background_guide);
    console.log('📝 Topics provided:', !!req.body.topics);
    console.log('📝 Topics type:', typeof req.body.topics);
    console.log('📝 Topics length:', req.body.topics ? req.body.topics.length : 0);
    
    const { title, description, category_id, image, background_guide, topics } = req.body;

    if (!title || !description || !category_id || !image) {
        console.log('❌ COMMITTEES: Missing required fields');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('☁️ COMMITTEES: Processing image upload...');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        let backgroundGuideUrl = null;

        if (typeof image === 'string') {
            console.log('📝 COMMITTEES: Image is base64 string, processing...');
            console.log('🔍 COMMITTEES: Raw image string length:', image.length);
            console.log('🔍 COMMITTEES: Image string start (first 150 chars):', image.substring(0, 150));

            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('📁 COMMITTEES: Original filename found:', originalFilename);
            } else {
                console.log('⚠️ COMMITTEES: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('❌ COMMITTEES: Invalid data URL format');
                console.log('🔍 COMMITTEES: Expected format: data:mime/type;name=filename;base64,data');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('🎯 COMMITTEES: Extracted MIME type:', mimeTypeFromUrl);
            console.log('🎯 COMMITTEES: Base64 data length:', base64Data.length);
            console.log('🎯 COMMITTEES: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('❌ COMMITTEES: Base64 data is too short or empty');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('✅ COMMITTEES: Buffer created successfully');
            } catch (bufferError) {
                console.log('❌ COMMITTEES: Failed to create buffer from base64:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('   - Using filename:', fileName);
            console.log('   - MIME type:', mimeType);
            console.log('   - Buffer size:', imageBuffer.length);
            console.log('   - Buffer is valid:', imageBuffer && imageBuffer.length > 0);
        } else if (image && image.buffer) {
            console.log('📁 COMMITTEES: Image is file object, processing...');
            imageBuffer = image.buffer;
            fileName = image.originalname || `committee_${Date.now()}.jpg`;
            mimeType = image.mimetype || 'image/jpeg';

            console.log('   - Original filename:', fileName);
            console.log('   - MIME type:', mimeType);
            console.log('   - Buffer size:', imageBuffer.length);
        } else {
            console.log('❌ COMMITTEES: Invalid image format');
            throw new Error('Invalid image format');
        }

        console.log('☁️ COMMITTEES: Uploading to Supabase storage...');
        
        // Debug the buffer before upload
        console.log('🔍 COMMITTEES: Pre-upload buffer validation:');
        console.log('   - Buffer length:', imageBuffer.length);
        console.log('   - Buffer start (hex):', imageBuffer.slice(0, 20).toString('hex'));
        console.log('   - Is valid JPEG header:', imageBuffer.slice(0, 3).toString('hex') === 'ffd8ff');
        
        const { data, error } = await supabase.storage
            .from('committee-images')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('❌ COMMITTEES: Supabase upload error:', error.message);
            console.log('🔍 COMMITTEES: Full error object:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ COMMITTEES: Image uploaded successfully');
        console.log('📊 COMMITTEES: Upload response data:', data);
        console.log('🔗 COMMITTEES: Getting public URL...');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('committee-images')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;
        console.log('🔗 COMMITTEES: Public URL:', imageUrl);

        // Handle background guide upload if provided
        if (background_guide) {
            console.log('📋 COMMITTEES: Processing background guide upload...');
            console.log('📋 COMMITTEES: Background guide type:', typeof background_guide);
            console.log('📋 COMMITTEES: Background guide length:', background_guide.length);
            
            let bgBuffer, bgFileName, bgMimeType;

            if (typeof background_guide === 'string') {
                console.log('📋 COMMITTEES: Background guide is base64 string, processing...');
                console.log('🔍 COMMITTEES: Raw background guide string length:', background_guide.length);
                console.log('🔍 COMMITTEES: Background guide string start (first 150 chars):', background_guide.substring(0, 150));

                // Extract filename from data URL if present
                let originalBgFilename = null;
                const bgNameMatch = background_guide.match(/data:[^;]+;name=([^;]+);/);
                if (bgNameMatch) {
                    originalBgFilename = decodeURIComponent(bgNameMatch[1]);
                    console.log('📁 COMMITTEES: Original background guide filename found:', originalBgFilename);
                } else {
                    console.log('⚠️ COMMITTEES: No filename found in background guide data URL');
                }
                
                // Check if the data URL is properly formatted
                const bgDataUrlMatch = background_guide.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!bgDataUrlMatch) {
                    console.log('❌ COMMITTEES: Invalid background guide data URL format');
                    console.log('🔍 COMMITTEES: Expected format: data:mime/type;name=filename;base64,data');
                    throw new Error('Invalid background guide base64 data URL format');
                }
                
                const bgMimeTypeFromUrl = bgDataUrlMatch[1];
                const bgBase64Data = bgDataUrlMatch[3];
                
                console.log('🎯 COMMITTEES: Background guide extracted MIME type:', bgMimeTypeFromUrl);
                console.log('🎯 COMMITTEES: Background guide base64 data length:', bgBase64Data.length);
                console.log('🎯 COMMITTEES: Background guide base64 data start (first 50 chars):', bgBase64Data.substring(0, 50));
                
                // Validate base64 data
                if (!bgBase64Data || bgBase64Data.length < 100) {
                    console.log('❌ COMMITTEES: Background guide base64 data is too short or empty');
                    throw new Error('Invalid background guide base64 data');
                }
                
                try {
                    bgBuffer = Buffer.from(bgBase64Data, 'base64');
                    console.log('✅ COMMITTEES: Background guide buffer created successfully');
                } catch (bufferError) {
                    console.log('❌ COMMITTEES: Failed to create buffer from background guide base64:', bufferError.message);
                    throw new Error('Failed to process background guide base64 data');
                }
                
                // Use exact original filename or fallback
                bgFileName = originalBgFilename || `background_guide_${Date.now()}.pdf`;
                bgMimeType = bgMimeTypeFromUrl || 'application/pdf';
                
                console.log('   - Using background guide filename:', bgFileName);
                console.log('   - Background guide MIME type:', bgMimeType);
                console.log('   - Background guide buffer size:', bgBuffer.length);
                console.log('   - Background guide buffer is valid:', bgBuffer && bgBuffer.length > 0);
            } else if (background_guide && background_guide.buffer) {
                console.log('📁 COMMITTEES: Background guide is file object, processing...');
                bgBuffer = background_guide.buffer;
                bgFileName = background_guide.originalname || `background_guide_${Date.now()}.pdf`;
                bgMimeType = background_guide.mimetype || 'application/pdf';

                console.log('   - Original background guide filename:', bgFileName);
                console.log('   - Background guide MIME type:', bgMimeType);
                console.log('   - Background guide buffer size:', bgBuffer.length);
            } else {
                console.log('❌ COMMITTEES: Invalid background guide format');
                throw new Error('Invalid background guide format');
            }

            console.log('☁️ COMMITTEES: Uploading background guide to Supabase storage...');
            
            // Debug the buffer before upload
            console.log('🔍 COMMITTEES: Pre-upload background guide buffer validation:');
            console.log('   - Buffer length:', bgBuffer.length);
            console.log('   - Buffer start (hex):', bgBuffer.slice(0, 20).toString('hex'));
            console.log('   - Is valid PDF header:', bgBuffer.slice(0, 4).toString('hex') === '25504446');
            
            const { data: bgData, error: bgError } = await supabase.storage
                .from('committee-background-guides')
                .upload(bgFileName, bgBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: bgMimeType
                });

            if (bgError) {
                console.log('❌ COMMITTEES: Supabase background guide upload error:', bgError.message);
                console.log('🔍 COMMITTEES: Full background guide error object:', JSON.stringify(bgError, null, 2));
                throw bgError;
            }

            console.log('✅ COMMITTEES: Background guide uploaded successfully');
            console.log('📊 COMMITTEES: Background guide upload response data:', bgData);
            console.log('🔗 COMMITTEES: Getting background guide public URL...');
            
            // Get the public URL for background guide
            const { data: bgPublicUrlData } = supabase.storage
                .from('committee-background-guides')
                .getPublicUrl(bgFileName);

            backgroundGuideUrl = bgPublicUrlData.publicUrl;
            console.log('🔗 COMMITTEES: Background guide public URL:', backgroundGuideUrl);
        } else {
            console.log('⚠️ COMMITTEES: No background guide provided');
        }

        // Create the committee in database
        console.log('💾 COMMITTEES: Creating committee in database...');
        const createResult = await pool.query(
            `INSERT INTO committees (title, description, category_id, image_url, background_guide_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [title, description, category_id, imageUrl, backgroundGuideUrl]
        );
        
        const newCommittee = createResult.rows[0];
        console.log('✅ COMMITTEES: Committee created with ID:', newCommittee.id);

        // Handle topics if provided
        if (topics && Array.isArray(topics) && topics.length > 0) {
            console.log('📝 COMMITTEES: Adding topics to committee...');
            for (const topic of topics) {
                if (topic.trim()) {
                    await pool.query(
                        'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                        [newCommittee.id, topic.trim()]
                    );
                    console.log('✅ COMMITTEES: Added topic:', topic.trim());
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('📋 COMMITTEES: Fetching updated committees list...');
        const allCommittees = await pool.query(`SELECT c.*, 
                                                cat.title as category_title, 
                                                cat.id AS category_id,
                                                COALESCE(
                                                    json_agg(
                                                        CASE WHEN t.id IS NOT NULL THEN
                                                            json_build_object('id', t.id, 'topic', t.topic)
                                                        END
                                                    ) FILTER (WHERE t.id IS NOT NULL),
                                                    '[]'::json
                                                ) as topics
                                            FROM committees c
                                            LEFT JOIN categories cat ON c.category_id = cat.id
                                            LEFT JOIN committee_topics t ON c.id = t.committee_id
                                            GROUP BY c.id, cat.id, cat.title
                                            ORDER BY c.order_num ASC, c.created_at ASC`);
        
        console.log('✅ COMMITTEES: Committee created successfully');
        res.status(201).json({ committees: allCommittees.rows, message: 'Committee created successfully' });
    } catch (error) {
        console.error('❌ COMMITTEES: Error occurred:', error.message);
        console.error('📍 COMMITTEES: Error stack:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a committee
exports.updateCommittee = async (req, res) => {
    console.log('📝 COMMITTEES: Update committee request received');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('🆔 Committee ID:', req.params.id);
    console.log('🏷️ Name:', req.body.name);
    console.log('🏢 Category ID:', req.body.category_id);
    console.log('📄 Description length:', req.body.description ? req.body.description.length : 0);
    console.log('🖼️ Photo provided:', !!req.body.photo);
    console.log('🖼️ Photo type:', typeof req.body.photo);
    console.log('🖼️ Photo value (first 100 chars):', req.body.photo ? req.body.photo.substring(0, 100) + '...' : null);
    console.log('✉️ Committee letter:', req.body.committee_letter);
    console.log('📊 Position order:', req.body.position_order);
    console.log('📝 Topics provided:', !!req.body.topics);
    console.log('📝 Topics type:', typeof req.body.topics);
    console.log('📝 Topics length:', req.body.topics ? req.body.topics.length : 0);

    const { id } = req.params;
    const { name, category_id, description, photo, committee_letter, position_order, topics } = req.body;

    if (!id || !category_id) {
        console.log('❌ COMMITTEES: Missing required fields');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let imageUrl = null;

        // Handle image upload if provided
        if (photo && typeof photo === 'string') {
            console.log('☁️ COMMITTEES: Processing image upload...');
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            console.log('📝 COMMITTEES: Photo is base64 string, processing...');
            console.log('🔍 COMMITTEES: Raw photo string length:', photo.length);
            console.log('🔍 COMMITTEES: Photo string start (first 150 chars):', photo.substring(0, 150));
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = photo.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('📁 COMMITTEES: Original filename found:', originalFilename);
            } else {
                console.log('⚠️ COMMITTEES: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = photo.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('❌ COMMITTEES: Invalid data URL format');
                console.log('🔍 COMMITTEES: Expected format: data:mime/type;name=filename;base64,data');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('🎯 COMMITTEES: Extracted MIME type:', mimeTypeFromUrl);
            console.log('🎯 COMMITTEES: Base64 data length:', base64Data.length);
            console.log('🎯 COMMITTEES: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('❌ COMMITTEES: Base64 data is too short or empty');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('✅ COMMITTEES: Buffer created successfully');
            } catch (bufferError) {
                console.log('❌ COMMITTEES: Failed to create buffer from base64:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('   - Using filename:', fileName);
            console.log('   - MIME type:', mimeType);
            console.log('   - Buffer size:', imageBuffer.length);
            console.log('   - Buffer is valid:', imageBuffer && imageBuffer.length > 0);

            console.log('☁️ COMMITTEES: Uploading to Supabase storage...');
            
            // Debug the buffer before upload
            console.log('🔍 COMMITTEES: Pre-upload buffer validation:');
            console.log('   - Buffer length:', imageBuffer.length);
            console.log('   - Buffer start (hex):', imageBuffer.slice(0, 20).toString('hex'));
            console.log('   - Is valid JPEG header:', imageBuffer.slice(0, 3).toString('hex') === 'ffd8ff');
            
            const { data, error } = await supabase.storage
                .from('committee-images')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('❌ COMMITTEES: Supabase upload error:', error.message);
                console.log('🔍 COMMITTEES: Full error object:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('✅ COMMITTEES: Image uploaded successfully');
            console.log('📊 COMMITTEES: Upload response data:', data);
            console.log('🔗 COMMITTEES: Getting public URL...');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('committee-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
            console.log('🔗 COMMITTEES: Public URL:', imageUrl);
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (name) {
            updateFields.push(`title = $${paramCount}`);
            updateValues.push(name);
            paramCount++;
        }
        
        if (description) {
            updateFields.push(`description = $${paramCount}`);
            updateValues.push(description);
            paramCount++;
        }
        
        if (category_id) {
            updateFields.push(`category_id = $${paramCount}`);
            updateValues.push(category_id);
            paramCount++;
        }
        
        if (imageUrl) {
            updateFields.push(`image_url = $${paramCount}`);
            updateValues.push(imageUrl);
            paramCount++;
        }
        
        if (committee_letter) {
            updateFields.push(`committee_letter = $${paramCount}`);
            updateValues.push(committee_letter);
            paramCount++;
        }
        
        if (position_order !== undefined) {
            updateFields.push(`order_num = $${paramCount}`);
            updateValues.push(position_order);
            paramCount++;
        }

        updateValues.push(id);

        console.log('💾 COMMITTEES: Updating committee in database...');
        await pool.query(
            `UPDATE committees SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
            updateValues
        );

        // Update topics if provided
        if (topics !== undefined) {
            console.log('📝 COMMITTEES: Updating topics...');
            
            // Delete existing topics
            await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
            console.log('🗑️ COMMITTEES: Existing topics deleted');
            
            // Add new topics
            if (Array.isArray(topics) && topics.length > 0) {
                for (const topic of topics) {
                    if (topic.trim()) {
                        await pool.query(
                            'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                            [id, topic.trim()]
                        );
                        console.log('✅ COMMITTEES: Added topic:', topic.trim());
                    }
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('📋 COMMITTEES: Fetching updated committees list...');
        const allCommittees = await pool.query(`SELECT c.*, 
                                                cat.title as category_title, 
                                                cat.id AS category_id,
                                                COALESCE(
                                                    json_agg(
                                                        CASE WHEN t.id IS NOT NULL THEN
                                                            json_build_object('id', t.id, 'topic', t.topic)
                                                        END
                                                    ) FILTER (WHERE t.id IS NOT NULL),
                                                    '[]'::json
                                                ) as topics
                                            FROM committees c
                                            LEFT JOIN categories cat ON c.category_id = cat.id
                                            LEFT JOIN committee_topics t ON c.id = t.committee_id
                                            GROUP BY c.id, cat.id, cat.title
                                            ORDER BY c.order_num ASC, c.created_at ASC`);

        console.log('✅ COMMITTEES: Committee updated successfully');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee updated successfully' });
    } catch (error) {
        console.error('❌ COMMITTEES: Error occurred:', error.message);
        console.error('📍 COMMITTEES: Error stack:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a committee
exports.deleteCommittee = async (req, res) => {
    console.log('📝 COMMITTEES: Delete committee request received');
    console.log('🆔 Committee ID:', req.params.id);

    const { id } = req.params;

    if (!id) {
        console.log('❌ COMMITTEES: Missing committee ID');
        return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
        console.log('🗑️ COMMITTEES: Deleting topics for committee...');
        await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
        
        console.log('🗑️ COMMITTEES: Deleting committee from database...');
        await pool.query('DELETE FROM committees WHERE id = $1', [id]);

        // Fetch all committees with topics for return
        console.log('📋 COMMITTEES: Fetching updated committees list...');
        const allCommittees = await pool.query(`SELECT c.*, 
                                                cat.title as category_title, 
                                                cat.id AS category_id,
                                                COALESCE(
                                                    json_agg(
                                                        CASE WHEN t.id IS NOT NULL THEN
                                                            json_build_object('id', t.id, 'topic', t.topic)
                                                        END
                                                    ) FILTER (WHERE t.id IS NOT NULL),
                                                    '[]'::json
                                                ) as topics
                                            FROM committees c
                                            LEFT JOIN categories cat ON c.category_id = cat.id
                                            LEFT JOIN committee_topics t ON c.id = t.committee_id
                                            GROUP BY c.id, cat.id, cat.title
                                            ORDER BY c.order_num ASC, c.created_at ASC`);

        console.log('✅ COMMITTEES: Committee deleted successfully');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee deleted successfully' });
    } catch (error) {
        console.error('❌ COMMITTEES: Error occurred:', error.message);
        console.error('📍 COMMITTEES: Error stack:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    console.log('📝 COMMITTEES: Create category request received');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('🏷️ Title:', req.body.title);
    
    const { title } = req.body;

    if (!title) {
        console.log('❌ COMMITTEES: Missing category title');
        return res.status(400).json({ message: 'Category title is required' });
    }

    try {
        console.log('💾 COMMITTEES: Creating category in database...');
        const result = await pool.query(
            'INSERT INTO categories (title) VALUES ($1) RETURNING *',
            [title]
        );
        
        const newCategory = result.rows[0];
        console.log('✅ COMMITTEES: Category created with ID:', newCategory.id);

        // Fetch all categories for return
        console.log('📋 COMMITTEES: Fetching updated categories list...');
        const allCategories = await pool.query('SELECT * FROM categories ORDER BY title ASC');

        console.log('✅ COMMITTEES: Category created successfully');
        res.status(201).json({ 
            categories: allCategories.rows, 
            newCategory: newCategory,
            message: 'Category created successfully' 
        });
    } catch (error) {
        console.error('❌ COMMITTEES: Error occurred:', error.message);
        console.error('📍 COMMITTEES: Error stack:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update committee positions/order
exports.updateCommitteePositions = async (req, res) => {
    console.log('📝 COMMITTEES: Update committee positions request received');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    const { committees } = req.body;

    if (!committees || !Array.isArray(committees)) {
        console.log('❌ COMMITTEES: Invalid committees data');
        return res.status(400).json({ message: 'Invalid committees data' });
    }

    try {
        console.log('💾 COMMITTEES: Updating committee positions...');
        
        for (const committee of committees) {
            await pool.query(
                'UPDATE committees SET order_num = $1 WHERE id = $2',
                [committee.order_num, committee.id]
            );
            console.log(`✅ COMMITTEES: Updated position for committee ${committee.id} to ${committee.order_num}`);
        }

        // Fetch all committees with topics for return
        console.log('📋 COMMITTEES: Fetching updated committees list...');
        const allCommittees = await pool.query(`SELECT c.*, 
                                                cat.title as category_title, 
                                                cat.id AS category_id,
                                                COALESCE(
                                                    json_agg(
                                                        CASE WHEN t.id IS NOT NULL THEN
                                                            json_build_object('id', t.id, 'topic', t.topic)
                                                        END
                                                    ) FILTER (WHERE t.id IS NOT NULL),
                                                    '[]'::json
                                                ) as topics
                                            FROM committees c
                                            LEFT JOIN categories cat ON c.category_id = cat.id
                                            LEFT JOIN committee_topics t ON c.id = t.committee_id
                                            GROUP BY c.id, cat.id, cat.title
                                            ORDER BY c.order_num ASC, c.created_at ASC`);

        console.log('✅ COMMITTEES: Positions updated successfully');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee positions updated successfully' });
    } catch (error) {
        console.error('❌ COMMITTEES: Error occurred:', error.message);
        console.error('📍 COMMITTEES: Error stack:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};
