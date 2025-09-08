const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

// Get all committees with topics
exports.getAllCommittees = async (req, res) => {
    console.log('committeeController.getAllCommittees: Function called - fetching all committees data');
    
    try {
        console.log('committeeController.getAllCommittees: Database query execution started for committees with topics');
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
        
        console.log('committeeController.getAllCommittees: Database query successful - retrieved committee data');
        console.log('committeeController.getAllCommittees: Committee data processing completed successfully');
        
        console.log('committeeController.getAllCommittees: Function completed successfully - sending response');
        res.status(200).json({ committees: result.rows });
    } catch (error) {
        console.error('committeeController.getAllCommittees: Database query failed with error:', error.message);
        console.error('committeeController.getAllCommittees: Function failed - error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    console.log('committeeController.getCategories: Function called - fetching categories data');
    
    try {
        console.log('committeeController.getCategories: Database query execution started for all categories');
        const result = await pool.query('SELECT * FROM categories ORDER BY title ASC');
        
        console.log('committeeController.getCategories: Database query successful - categories retrieved');
        console.log('committeeController.getCategories: Category processing completed - count:', result.rows.length);
        
        console.log('committeeController.getCategories: Function completed successfully - sending response');
        res.status(200).json({ categories: result.rows });
    } catch (error) {
        console.error('committeeController.getCategories: Database query failed with error:', error.message);
        console.error('committeeController.getCategories: Function failed - error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new committee
exports.createCommittee = async (req, res) => {
    console.log('committeeController.createCommittee: Function called - committee creation request received');
    console.log('committeeController.createCommittee: Request data validation started');
    console.log('committeeController.createCommittee: Background guide processing initiated');
    console.log('committeeController.createCommittee: Topics array processing started');
    
    const { title, description, category_id, image, background_guide, topics } = req.body;

    if (!title || !description || !category_id || !image) {
        console.log('committeeController.createCommittee: Required field validation failed - missing data');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('committeeController.createCommittee: Image upload processing workflow initiated');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        let backgroundGuideUrl = null;

        if (typeof image === 'string') {
            console.log('committeeController.createCommittee: Base64 image string processing started');
            console.log('committeeController.createCommittee: Image data validation and parsing initiated');

            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = image.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('committeeController.createCommittee: Original filename extraction successful');
            } else {
                console.log('committeeController.createCommittee: No filename found in data URL - using default');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = image.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('committeeController.createCommittee: Data URL format validation failed');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('committeeController.createCommittee: MIME type extraction completed successfully');
            console.log('committeeController.createCommittee: Base64 data parsing completed');
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('committeeController.createCommittee: Base64 data validation failed - insufficient data');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('committeeController.createCommittee: Buffer creation from base64 data successful');
            } catch (bufferError) {
                console.log('committeeController.createCommittee: Buffer creation from base64 data failed:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('committeeController.createCommittee: Filename assignment completed for storage');
            console.log('committeeController.createCommittee: MIME type configuration set successfully');
            console.log('committeeController.createCommittee: Buffer validation completed - ready for upload');
        } else if (image && image.buffer) {
            console.log('committeeController.createCommittee: File object image processing started');
            imageBuffer = image.buffer;
            fileName = image.originalname || `committee_${Date.now()}.jpg`;
            mimeType = image.mimetype || 'image/jpeg';

            console.log('committeeController.createCommittee: File object data extraction completed');
        } else {
            console.log('committeeController.createCommittee: Image format validation failed - invalid format');
            throw new Error('Invalid image format');
        }

        console.log('committeeController.createCommittee: Supabase storage upload process initiated');
        
        // Debug the buffer before upload
        console.log('committeeController.createCommittee: Pre-upload buffer validation started');
        console.log('committeeController.createCommittee: Image header validation completed');
        
        const { data, error } = await supabase.storage
            .from('committee-images')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('committeeController.createCommittee: Supabase upload process failed:', error.message);
            throw error;
        }

        console.log('committeeController.createCommittee: Image upload to Supabase completed successfully');
        console.log('committeeController.createCommittee: Public URL generation initiated');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('committee-images')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;
        console.log('committeeController.createCommittee: Public URL generation completed successfully');

        // Handle background guide upload if provided
        if (background_guide) {
            console.log('committeeController.createCommittee: Background guide processing initiated');
            
            let bgBuffer, bgFileName, bgMimeType;

            if (typeof background_guide === 'string') {
                console.log('committeeController.createCommittee: Background guide base64 string processing started');

                // Extract filename from data URL if present
                let originalBgFilename = null;
                const bgNameMatch = background_guide.match(/data:[^;]+;name=([^;]+);/);
                if (bgNameMatch) {
                    originalBgFilename = decodeURIComponent(bgNameMatch[1]);
                    console.log('committeeController.createCommittee: Background guide filename extraction successful');
                } else {
                    console.log('committeeController.createCommittee: No filename found in background guide data URL');
                }
                
                // Check if the data URL is properly formatted
                const bgDataUrlMatch = background_guide.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!bgDataUrlMatch) {
                    console.log('committeeController.createCommittee: Background guide data URL format validation failed');
                    throw new Error('Invalid background guide base64 data URL format');
                }
                
                const bgMimeTypeFromUrl = bgDataUrlMatch[1];
                const bgBase64Data = bgDataUrlMatch[3];
                
                console.log('committeeController.createCommittee: Background guide MIME type extraction completed');
                console.log('committeeController.createCommittee: Background guide base64 data parsing completed');
                
                // Validate base64 data
                if (!bgBase64Data || bgBase64Data.length < 100) {
                    console.log('committeeController.createCommittee: Background guide base64 data validation failed');
                    throw new Error('Invalid background guide base64 data');
                }
                
                try {
                    bgBuffer = Buffer.from(bgBase64Data, 'base64');
                    console.log('committeeController.createCommittee: Background guide buffer creation successful');
                } catch (bufferError) {
                    console.log('committeeController.createCommittee: Background guide buffer creation failed:', bufferError.message);
                    throw new Error('Failed to process background guide base64 data');
                }
                
                // Use exact original filename or fallback
                bgFileName = originalBgFilename || `background_guide_${Date.now()}.pdf`;
                bgMimeType = bgMimeTypeFromUrl || 'application/pdf';
                
                console.log('committeeController.createCommittee: Background guide filename assignment completed');
                console.log('committeeController.createCommittee: Background guide MIME type configuration set');
                console.log('committeeController.createCommittee: Background guide buffer validation completed');
            } else if (background_guide && background_guide.buffer) {
                console.log('committeeController.createCommittee: Background guide file object processing started');
                bgBuffer = background_guide.buffer;
                bgFileName = background_guide.originalname || `background_guide_${Date.now()}.pdf`;
                bgMimeType = background_guide.mimetype || 'application/pdf';

                console.log('committeeController.createCommittee: Background guide file object data extraction completed');
            } else {
                console.log('committeeController.createCommittee: Background guide format validation failed');
                throw new Error('Invalid background guide format');
            }

            console.log('committeeController.createCommittee: Background guide Supabase upload initiated');
            
            // Debug the buffer before upload
            console.log('committeeController.createCommittee: Background guide pre-upload validation started');
            
            const { data: bgData, error: bgError } = await supabase.storage
                .from('committee-background-guides')
                .upload(bgFileName, bgBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: bgMimeType
                });

            if (bgError) {
                console.log('committeeController.createCommittee: Background guide Supabase upload failed:', bgError.message);
                throw bgError;
            }

            console.log('committeeController.createCommittee: Background guide upload completed successfully');
            console.log('committeeController.createCommittee: Background guide public URL generation initiated');
            
            // Get the public URL for background guide
            const { data: bgPublicUrlData } = supabase.storage
                .from('committee-background-guides')
                .getPublicUrl(bgFileName);

            backgroundGuideUrl = bgPublicUrlData.publicUrl;
            console.log('committeeController.createCommittee: Background guide public URL generation completed');
        } else {
            console.log('committeeController.createCommittee: No background guide provided - skipping');
        }

        // Create the committee in database
        console.log('committeeController.createCommittee: Database committee insertion initiated');
        const createResult = await pool.query(
            `INSERT INTO committees (title, description, category_id, image_url, background_guide_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [title, description, category_id, imageUrl, backgroundGuideUrl]
        );
        
        const newCommittee = createResult.rows[0];
        console.log('committeeController.createCommittee: Committee database insertion successful - ID:', newCommittee.id);

        // Handle topics if provided
        if (topics && Array.isArray(topics) && topics.length > 0) {
            console.log('committeeController.createCommittee: Topics processing initiated for committee');
            for (const topic of topics) {
                if (topic.trim()) {
                    await pool.query(
                        'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                        [newCommittee.id, topic.trim()]
                    );
                    console.log('committeeController.createCommittee: Topic added successfully:', topic.trim());
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('committeeController.createCommittee: Updated committees list retrieval initiated');
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
        
        console.log('committeeController.createCommittee: Function completed successfully - committee created');
        res.status(201).json({ committees: allCommittees.rows, message: 'Committee created successfully' });
    } catch (error) {
        console.error('committeeController.createCommittee: Function failed with error:', error.message);
        console.error('committeeController.createCommittee: Error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a committee
exports.updateCommittee = async (req, res) => {
    console.log('committeeController.updateCommittee: Function called - committee update request received');
    console.log('committeeController.updateCommittee: Request data validation initiated');

    const { id } = req.params;
    const { name, category_id, description, photo, committee_letter, position_order, topics } = req.body;

    if (!id || !category_id) {
        console.log('committeeController.updateCommittee: Required field validation failed - missing data');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let imageUrl = null;

        // Handle image upload if provided
        if (photo && typeof photo === 'string') {
            console.log('committeeController.updateCommittee: Image upload processing initiated');
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            console.log('committeeController.updateCommittee: Base64 image string processing started');
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = photo.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('committeeController.updateCommittee: Original filename extraction successful');
            } else {
                console.log('committeeController.updateCommittee: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = photo.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('committeeController.updateCommittee: Data URL format validation failed');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('committeeController.updateCommittee: MIME type extraction completed');
            console.log('committeeController.updateCommittee: Base64 data parsing completed');
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('committeeController.updateCommittee: Base64 data validation failed');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('committeeController.updateCommittee: Buffer creation successful');
            } catch (bufferError) {
                console.log('committeeController.updateCommittee: Buffer creation failed:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `committee_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('committeeController.updateCommittee: Filename and MIME type configuration completed');

            console.log('committeeController.updateCommittee: Supabase storage upload initiated');
            
            // Debug the buffer before upload
            console.log('committeeController.updateCommittee: Pre-upload buffer validation completed');
            
            const { data, error } = await supabase.storage
                .from('committee-images')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('committeeController.updateCommittee: Supabase upload failed:', error.message);
                throw error;
            }

            console.log('committeeController.updateCommittee: Image upload completed successfully');
            console.log('committeeController.updateCommittee: Public URL generation initiated');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('committee-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
            console.log('committeeController.updateCommittee: Public URL generation completed');
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

        console.log('committeeController.updateCommittee: Database committee update initiated');
        await pool.query(
            `UPDATE committees SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
            updateValues
        );

        // Update topics if provided
        if (topics !== undefined) {
            console.log('committeeController.updateCommittee: Topics update processing initiated');
            
            // Delete existing topics
            await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
            console.log('committeeController.updateCommittee: Existing topics deletion completed');
            
            // Add new topics
            if (Array.isArray(topics) && topics.length > 0) {
                for (const topic of topics) {
                    if (topic.trim()) {
                        await pool.query(
                            'INSERT INTO committee_topics (committee_id, topic) VALUES ($1, $2)',
                            [id, topic.trim()]
                        );
                        console.log('committeeController.updateCommittee: Topic added successfully:', topic.trim());
                    }
                }
            }
        }

        // Fetch all committees with topics for return
        console.log('committeeController.updateCommittee: Updated committees list retrieval initiated');
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

        console.log('committeeController.updateCommittee: Function completed successfully - committee updated');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee updated successfully' });
    } catch (error) {
        console.error('committeeController.updateCommittee: Function failed with error:', error.message);
        console.error('committeeController.updateCommittee: Error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a committee
exports.deleteCommittee = async (req, res) => {
    console.log('committeeController.deleteCommittee: Function called - committee deletion request received');

    const { id } = req.params;

    if (!id) {
        console.log('committeeController.deleteCommittee: Committee ID validation failed - missing ID');
        return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
        console.log('committeeController.deleteCommittee: Topics deletion for committee initiated');
        await pool.query('DELETE FROM committee_topics WHERE committee_id = $1', [id]);
        
        console.log('committeeController.deleteCommittee: Committee database deletion initiated');
        await pool.query('DELETE FROM committees WHERE id = $1', [id]);

        // Fetch all committees with topics for return
        console.log('committeeController.deleteCommittee: Updated committees list retrieval initiated');
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

        console.log('committeeController.deleteCommittee: Function completed successfully - committee deleted');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee deleted successfully' });
    } catch (error) {
        console.error('committeeController.deleteCommittee: Function failed with error:', error.message);
        console.error('committeeController.deleteCommittee: Error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    console.log('committeeController.createCategory: Function called - category creation request received');
    
    const { title } = req.body;

    if (!title) {
        console.log('committeeController.createCategory: Category title validation failed - missing title');
        return res.status(400).json({ message: 'Category title is required' });
    }

    try {
        console.log('committeeController.createCategory: Database category insertion initiated');
        const result = await pool.query(
            'INSERT INTO categories (title) VALUES ($1) RETURNING *',
            [title]
        );
        
        const newCategory = result.rows[0];
        console.log('committeeController.createCategory: Category database insertion successful - ID:', newCategory.id);

        // Fetch all categories for return
        console.log('committeeController.createCategory: Updated categories list retrieval initiated');
        const allCategories = await pool.query('SELECT * FROM categories ORDER BY title ASC');

        console.log('committeeController.createCategory: Function completed successfully - category created');
        res.status(201).json({ 
            categories: allCategories.rows, 
            newCategory: newCategory,
            message: 'Category created successfully' 
        });
    } catch (error) {
        console.error('committeeController.createCategory: Function failed with error:', error.message);
        console.error('committeeController.createCategory: Error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update committee positions/order
exports.updateCommitteePositions = async (req, res) => {
    console.log('committeeController.updateCommitteePositions: Function called - position update request received');
    
    const { committees } = req.body;

    if (!committees || !Array.isArray(committees)) {
        console.log('committeeController.updateCommitteePositions: Committee data validation failed - invalid format');
        return res.status(400).json({ message: 'Invalid committees data' });
    }

    try {
        console.log('committeeController.updateCommitteePositions: Committee positions update processing initiated');
        
        for (const committee of committees) {
            await pool.query(
                'UPDATE committees SET order_num = $1 WHERE id = $2',
                [committee.order_num, committee.id]
            );
            console.log('committeeController.updateCommitteePositions: Position updated for committee ID:', committee.id, 'to order:', committee.order_num);
        }

        // Fetch all committees with topics for return
        console.log('committeeController.updateCommitteePositions: Updated committees list retrieval initiated');
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

        console.log('committeeController.updateCommitteePositions: Function completed successfully - positions updated');
        res.status(200).json({ committees: allCommittees.rows, message: 'Committee positions updated successfully' });
    } catch (error) {
        console.error('committeeController.updateCommitteePositions: Function failed with error:', error.message);
        console.error('committeeController.updateCommitteePositions: Error details:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};
