const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

const validateImageFormat = (photo) => {
    if (!photo || typeof photo !== 'string') {
        return { isValid: false, type: null, error: 'Invalid photo data' };
    }
    
    // Check if it's a base64 data URL
    if (photo.startsWith('data:') && photo.includes('base64,')) {
        const dataUrlMatch = photo.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
        if (dataUrlMatch && dataUrlMatch[3].length > 100) {
            console.log('MIDDLEWARE: Image is valid base64 data URL');
            return { isValid: true, type: 'base64', error: null };
        }
        console.log('MIDDLEWARE: Base64 data URL validation failed');
        return { isValid: false, type: null, error: 'Invalid base64 format or insufficient data' };
    }
    
    // Check if it's a valid URL
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
        try {
            new URL(photo);
            console.log('MIDDLEWARE: Image is valid URL');
            return { isValid: true, type: 'url', error: null };
        } catch {
            console.log('MIDDLEWARE: URL validation failed');
            return { isValid: false, type: null, error: 'Invalid URL format' };
        }
    }
    
    console.log('MIDDLEWARE: Photo must be base64 data URL or valid URL');
    return { isValid: false, type: null, error: 'Photo must be base64 data URL or valid URL' };
};

// Get all committees with topics
exports.getAllCommittees = async (req, res) => {
    console.log('GET COMMITTEE: Function called - fetching all committees data');
    
    try {
        console.log('GET COMMITTEE: Database query execution started for committees with topics');
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
        
        console.log('GET COMMITTEE: Database query successful - retrieved committee data');
        console.log('GET COMMITTEE: Committee data processing completed successfully');
        
        console.log('GET COMMITTEE: Function completed successfully - sending response\n');
        res.status(200).json({ committees: result.rows });
    } catch (error) {
        console.error('GET COMMITTEE: Database query failed with error:', error.message);
        console.error('GET COMMITTEE: Function failed - error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    console.log('GET COMMITTEE: Function called - fetching categories data');
    
    try {
        console.log('GET COMMITTEE: Database query execution started for all categories');
        const result = await pool.query('SELECT * FROM categories ORDER BY title ASC');
        
        console.log('GET COMMITTEE: Database query successful - categories retrieved');
        console.log('GET COMMITTEE: Category processing completed - count:', result.rows.length);
        
        console.log('GET COMMITTEE: Function completed successfully - sending response\n');
        res.status(200).json({ categories: result.rows });
    } catch (error) {
        console.error('GET COMMITTEE: Database query failed with error:', error.message);
        console.error('GET COMMITTEE: Function failed - error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new committee
exports.createCommittee = async (req, res) => {
    console.log('CREATE COMMITTEE: Function called - committee creation request received');
    console.log('CREATE COMMITTEE: Request data validation started');
    console.log('CREATE COMMITTEE: Background guide processing initiated');
    console.log('CREATE COMMITTEE: Topics array processing started');
    
    const { title, description, category_id, image, background_guide, topics } = req.body;

    if (!title || !description || !category_id || !image) {
        console.log('CREATE COMMITTEE: Required field validation failed - missing data\n');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('CREATE COMMITTEE: Image upload processing workflow initiated');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        let backgroundGuideUrl = null;

        if (typeof image === 'string') {
            console.log('CREATE COMMITTEE: Base64 image string processing started');
            console.log('CREATE COMMITTEE: Image data validation and parsing initiated');

            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('CREATE COMMITTEE: Original filename extraction successful');
            } else {
                console.log('CREATE COMMITTEE: No filename found in data URL - using default');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('CREATE COMMITTEE: Data URL format validation failed');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('CREATE COMMITTEE: MIME type extraction completed successfully');
            console.log('CREATE COMMITTEE: Base64 data parsing completed');
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('CREATE COMMITTEE: Base64 data validation failed - insufficient data');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('CREATE COMMITTEE: Buffer creation from base64 data successful');
            } catch (bufferError) {
                console.log('CREATE COMMITTEE: Buffer creation from base64 data failed:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('CREATE COMMITTEE: Filename assignment completed for storage');
            console.log('CREATE COMMITTEE: MIME type configuration set successfully');
            console.log('CREATE COMMITTEE: Buffer validation completed - ready for upload');
        } else if (image && image.buffer) {
            console.log('CREATE COMMITTEE: File object image processing started');
            imageBuffer = image.buffer;
            fileName = image.originalname || `committee_${Date.now()}.jpg`;
            mimeType = image.mimetype || 'image/jpeg';

            console.log('CREATE COMMITTEE: File object data extraction completed');
        } else {
            console.log('CREATE COMMITTEE: Image format validation failed - invalid format');
            throw new Error('Invalid image format');
        }

        console.log('CREATE COMMITTEE: Supabase storage upload process initiated');
        
        // Debug the buffer before upload
        console.log('CREATE COMMITTEE: Pre-upload buffer validation started');
        console.log('CREATE COMMITTEE: Image header validation completed');
        
        const { data, error } = await supabase.storage
            .from('committee-images')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('CREATE COMMITTEE: Supabase upload process failed:', error.message);
            throw error;
        }

        console.log('CREATE COMMITTEE: Image upload to Supabase completed successfully');
        console.log('CREATE COMMITTEE: Public URL generation initiated');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('committee-images')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;
        console.log('CREATE COMMITTEE: Public URL generation completed successfully');

        // Handle background guide upload if provided
        if (background_guide) {
            console.log('CREATE COMMITTEE: Background guide processing initiated');
            
            let bgBuffer, bgFileName, bgMimeType;

            if (typeof background_guide === 'string') {
                console.log('CREATE COMMITTEE: Background guide base64 string processing started');

                // Extract filename from data URL if present
                let originalBgFilename = null;
                const bgNameMatch = background_guide.match(/data:[^;]+;name=([^;]+);/);
                if (bgNameMatch) {
                    originalBgFilename = decodeURIComponent(bgNameMatch[1]);
                    console.log('CREATE COMMITTEE: Background guide filename extraction successful');
                } else {
                    console.log('CREATE COMMITTEE: No filename found in background guide data URL');
                }
                
                // Check if the data URL is properly formatted
                const bgDataUrlMatch = background_guide.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!bgDataUrlMatch) {
                    console.log('CREATE COMMITTEE: Background guide data URL format validation failed');
                    throw new Error('Invalid background guide base64 data URL format');
                }
                
                const bgMimeTypeFromUrl = bgDataUrlMatch[1];
                const bgBase64Data = bgDataUrlMatch[3];
                
                console.log('CREATE COMMITTEE: Background guide MIME type extraction completed');
                console.log('CREATE COMMITTEE: Background guide base64 data parsing completed');
                
                // Validate base64 data
                if (!bgBase64Data || bgBase64Data.length < 100) {
                    console.log('CREATE COMMITTEE: Background guide base64 data validation failed');
                    throw new Error('Invalid background guide base64 data');
                }
                
                try {
                    bgBuffer = Buffer.from(bgBase64Data, 'base64');
                    console.log('CREATE COMMITTEE: Background guide buffer creation successful');
                } catch (bufferError) {
                    console.log('CREATE COMMITTEE: Background guide buffer creation failed:', bufferError.message);
                    throw new Error('Failed to process background guide base64 data');
                }
                
                // Use exact original filename or fallback
                bgFileName = originalBgFilename || `background_guide_${Date.now()}.pdf`;
                bgMimeType = bgMimeTypeFromUrl || 'application/pdf';
                
                console.log('CREATE COMMITTEE: Background guide filename assignment completed');
                console.log('CREATE COMMITTEE: Background guide MIME type configuration set');
                console.log('CREATE COMMITTEE: Background guide buffer validation completed');
            } else if (background_guide && background_guide.buffer) {
                console.log('CREATE COMMITTEE: Background guide file object processing started');
                bgBuffer = background_guide.buffer;
                bgFileName = background_guide.originalname || `background_guide_${Date.now()}.pdf`;
                bgMimeType = background_guide.mimetype || 'application/pdf';

                console.log('CREATE COMMITTEE: Background guide file object data extraction completed');
            } else {
                console.log('CREATE COMMITTEE: Background guide format validation failed');
                throw new Error('Invalid background guide format');
            }

            console.log('CREATE COMMITTEE: Background guide Supabase upload initiated');
            
            // Debug the buffer before upload
            console.log('CREATE COMMITTEE: Background guide pre-upload validation started');
            
            const { data: bgData, error: bgError } = await supabase.storage
                .from('committee-background-guides')
                .upload(bgFileName, bgBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: bgMimeType
                });

            if (bgError) {
                console.log('CREATE COMMITTEE: Background guide Supabase upload failed:', bgError.message);
                throw bgError;
            }

            console.log('CREATE COMMITTEE: Background guide upload completed successfully');
            console.log('CREATE COMMITTEE: Background guide public URL generation initiated');
            
            // Get the public URL for background guide
            const { data: bgPublicUrlData } = supabase.storage
                .from('committee-background-guides')
                .getPublicUrl(bgFileName);

            backgroundGuideUrl = bgPublicUrlData.publicUrl;
            console.log('CREATE COMMITTEE: Background guide public URL generation completed');
        } else {
            console.log('CREATE COMMITTEE: No background guide provided - skipping');
        }

        // Create the committee in database
        console.log('CREATE COMMITTEE: Database committee insertion initiated');
        const createResult = await pool.query(
            `INSERT INTO committees (title, description, category_id, image_url, background_guide_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [title, description, category_id, imageUrl, backgroundGuideUrl]
        );
        
        const newCommittee = createResult.rows[0];
        console.log('CREATE COMMITTEE: Committee database insertion successful - ID:', newCommittee.id);

        // Handle topics if provided
        if (topics && Array.isArray(topics) && topics.length > 0) {
            console.log('CREATE COMMITTEE: Topics processing initiated for committee');
            for (const topic of topics) {
                if (topic.trim()) {
                    await pool.query(
                        'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                        [newCommittee.id, topic.trim()]
                    );
                    console.log('CREATE COMMITTEE: Topic added successfully:', topic.trim());
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('CREATE COMMITTEE: Updated committees list retrieval initiated');
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
        
        console.log('CREATE COMMITTEE: Function completed successfully - committee created\n');
        res.status(201).json({ committees: allCommittees.rows, message: 'Committee created successfully' });
    } catch (error) {
        console.error('CREATE COMMITTEE: Function failed with error:', error.message);
        console.error('CREATE COMMITTEE: Error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a committee
exports.updateCommittee = async (req, res) => {
    console.log('UPDATE COMMITTEE: Function called - committee update request received');
    console.log('UPDATE COMMITTEE: Request data validation initiated');

    const { id } = req.params;
    const { name, category_id, description, photo, committee_letter, position_order, topics } = req.body;

    console.log('UPDATE COMMITTEE: request body:', req.body, " for committee ID:", id);

    if (!id || !category_id) {
        console.log('UPDATE COMMITTEE: Required field validation failed - missing data\n');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let imageUrl = null;

        const validation = validateImageFormat(photo);
        if (!validation.isValid) {
            console.log('UPDATE COMMITTEE: Image format validation failed:', validation.error);
            return res.status(400).json({ message: `Invalid image format: ${validation.error}` });
        }

        const currentRecord = await pool.query('SELECT * FROM committees WHERE id = $1', [id]);
        if (currentRecord.rows.length === 0) {
            console.log('UPDATE COMMITTEE: Committee not found for ID:', id, '\n');
            return res.status(404).json({ message: 'Committee not found' });
        }

        console.log('UPDATE COMMITTEE: Current committee record retrieval successful');

        // If the photo is a URL and hasn't changed, keep existing
        if (validation.type === 'url' && photo === currentRecord.rows[0].image_url) {
            console.log('UPDATE COMMITTEE: Image URL unchanged - retaining existing URL', photo);
        }

        // Handle image upload if provided
        if ((photo && typeof photo === 'string') && photo !== currentRecord.rows[0].image_url) {
            console.log('UPDATE COMMITTEE: Image upload processing initiated', photo);
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            console.log('UPDATE COMMITTEE: Base64 image string processing started');
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = photo.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('UPDATE COMMITTEE: Original filename extraction successful');
            } else {
                console.log('UPDATE COMMITTEE: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = photo.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('UPDATE COMMITTEE: Data URL format validation failed');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('UPDATE COMMITTEE: MIME type extraction completed');
            console.log('UPDATE COMMITTEE: Base64 data parsing completed');
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('UPDATE COMMITTEE: Base64 data validation failed');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('UPDATE COMMITTEE: Buffer creation successful');
            } catch (bufferError) {
                console.log('UPDATE COMMITTEE: Buffer creation failed:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('UPDATE COMMITTEE: Filename and MIME type configuration completed');

            console.log('UPDATE COMMITTEE: Supabase storage upload initiated');
            
            // Debug the buffer before upload
            console.log('UPDATE COMMITTEE: Pre-upload buffer validation completed');
            
            const { data, error } = await supabase.storage
                .from('committee-images')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('UPDATE COMMITTEE: Supabase upload failed:', error.message);
                throw error;
            }

            console.log('UPDATE COMMITTEE: Image upload completed successfully');
            console.log('UPDATE COMMITTEE: Public URL generation initiated');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('committee-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
            console.log('UPDATE COMMITTEE: Public URL generation completed');
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

        console.log('UPDATE COMMITTEE: Database committee update initiated');
        await pool.query(
            `UPDATE committees SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
            updateValues
        );

        // Update topics if provided
        if (topics !== undefined) {
            console.log('UPDATE COMMITTEE: Topics update processing initiated');
            
            // Delete existing topics
            await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
            console.log('UPDATE COMMITTEE: Existing topics deletion completed');
            
            // Add new topics
            if (Array.isArray(topics) && topics.length > 0) {
                for (const topic of topics) {
                    if (topic.trim()) {
                        await pool.query(
                            'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                            [id, topic.trim()]
                        );
                        console.log('UPDATE COMMITTEE: Topic added successfully:', topic.trim());
                    }
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('UPDATE COMMITTEE: Updated committees list retrieval initiated');
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

        console.log('UPDATE COMMITTEE: Function completed successfully - committee updated\n');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee updated successfully' });
    } catch (error) {
        console.error('UPDATE COMMITTEE: Function failed with error:', error.message);
        console.error('UPDATE COMMITTEE: Error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a committee
exports.deleteCommittee = async (req, res) => {
    console.log('DELETE COMMITTEE: Function called - committee deletion request received');

    const { id } = req.params;

    if (!id) {
        console.log('DELETE COMMITTEE: Committee ID validation failed - missing ID\n');
        return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
        console.log('DELETE COMMITTEE: Topics deletion for committee initiated');
        await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
        
        console.log('DELETE COMMITTEE: Committee database deletion initiated');
        await pool.query('DELETE FROM committees WHERE id = $1', [id]);

        // Fetch all committees with topics for return
        console.log('DELETE COMMITTEE: Updated committees list retrieval initiated');
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

        console.log('DELETE COMMITTEE: Function completed successfully - committee deleted\n');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee deleted successfully' });
    } catch (error) {
        console.error('DELETE COMMITTEE: Function failed with error:', error.message);
        console.error('DELETE COMMITTEE: Error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    console.log('CREATE CATEGORY: Function called - category creation request received');
    
    const { title } = req.body;

    if (!title) {
        console.log('CREATE CATEGORY: Category title validation failed - missing title\n');
        return res.status(400).json({ message: 'Category title is required' });
    }

    try {
        console.log('CREATE CATEGORY: Database category insertion initiated');
        const result = await pool.query(
            'INSERT INTO categories (title) VALUES ($1) RETURNING *',
            [title]
        );
        
        const newCategory = result.rows[0];
        console.log('CREATE CATEGORY: Category database insertion successful - ID:', newCategory.id);

        // Fetch all categories for return
        console.log('CREATE CATEGORY: Updated categories list retrieval initiated');
        const allCategories = await pool.query('SELECT * FROM categories ORDER BY title ASC');

        console.log('CREATE CATEGORY: Function completed successfully - category created\n');
        res.status(201).json({ 
            categories: allCategories.rows, 
            newCategory: newCategory,
            message: 'Category created successfully' 
        });
    } catch (error) {
        console.error('CREATE CATEGORY: Function failed with error:', error.message);
        console.error('CREATE CATEGORY: Error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};

// Update committee positions/order
exports.updateCommitteePositions = async (req, res) => {
    console.log('UPDATE COMMITTEE ORDER: Function called - position update request received');
    
    const { committees } = req.body;

    if (!committees || !Array.isArray(committees)) {
        console.log('UPDATE COMMITTEE ORDER: Committee data validation failed - invalid format\n');
        return res.status(400).json({ message: 'Invalid committees data' });
    }

    try {
        console.log('UPDATE COMMITTEE ORDER: Committee positions update processing initiated');
        
        for (const committee of committees) {
            await pool.query(
                'UPDATE committees SET order_num = $1 WHERE id = $2',
                [committee.order_num, committee.id]
            );
            console.log('UPDATE COMMITTEE ORDER: Position updated for committee ID:', committee.id, 'to order:', committee.order_num);
        }

        // Fetch all committees with topics for return
        console.log('UPDATE COMMITTEE ORDER: Updated committees list retrieval initiated');
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

        console.log('UPDATE COMMITTEE ORDER: Function completed successfully - positions updated\n');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee positions updated successfully' });
    } catch (error) {
        console.error('UPDATE COMMITTEE ORDER: Function failed with error:', error.message);
        console.error('UPDATE COMMITTEE ORDER: Error details:', error.stack, '\n');
        res.status(500).json({ message: 'Server error' });
    }
};
