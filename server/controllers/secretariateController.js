const pool = require('../config/db');
const supabase = require('../config/supabaseClient');

// get all the secretariates
exports.getAllSecretariates = async (req, res) => {
    console.log('GET SECRETARIATES: Function called - secretariates data retrieval request received');
    
    try {
        console.log('GET SECRETARIATES: Database query execution started for all secretariates');
        const result = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
        console.log('GET SECRETARIATES: Database query successful - secretariates count:', result.rows.length);

        res.status(200).json({ secretariate: result.rows, message: 'Secretariates fetched successfully' });
    } catch (error) {
        console.error('GET SECRETARIATES: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new Secretariate
exports.createSecretariate = async (req, res) => {
    console.log('POST SECRETARIATES: Create secretariate request received and processing');
    console.log('POST SECRETARIATES: Full request body analysis:', JSON.stringify(req.body, null, 2));
    
    const { name, title, description, pfp } = req.body;

    if (!name || !title || !description) {
        console.log('POST SECRETARIATES: Missing required fields\n');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let finalPfpUrl = pfp;
    if(!finalPfpUrl) {
        finalPfpUrl = 'https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png'; // Default image URL
        console.log('POST SECRETARIATES: No PFP provided, using default image URL');
    }

    try {
        let publicUrl = finalPfpUrl; // Default to the URL we have
        
        if(finalPfpUrl && finalPfpUrl.startsWith('data:')) {
        console.log('POST SECRETARIATES: Processing image upload...');
        
        // Handle base64 image data from frontend
        let imageBuffer, fileName, mimeType;
        
        if (typeof pfp === 'string') {
            console.log('POST SECRETARIATES: PFP is base64 string, processing...');
            console.log('POST SECRETARIATES: Raw PFP string length:', pfp.length);
            console.log('POST SECRETARIATES: PFP string start (first 150 chars):', pfp.substring(0, 150));
            
            // Extract filename from data URL if present
            let originalFilename = null;
            const nameMatch = pfp.match(/data:[^;]+;name=([^;]+);/);
            if (nameMatch) {
                originalFilename = decodeURIComponent(nameMatch[1]);
                console.log('POST SECRETARIATES: Original filename found:', originalFilename);
            } else {
                console.log('POST SECRETARIATES: No filename found in data URL');
            }
            
            // Check if the data URL is properly formatted
            const dataUrlMatch = pfp.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
            if (!dataUrlMatch) {
                console.log('POST SECRETARIATES: Invalid data URL format');
                console.log('POST SECRETARIATES: Expected format: data:mime/type;name=filename;base64,data');
                throw new Error('Invalid base64 data URL format');
            }
            
            const mimeTypeFromUrl = dataUrlMatch[1];
            const base64Data = dataUrlMatch[3];
            
            console.log('POST SECRETARIATES: Extracted MIME type:', mimeTypeFromUrl);
            console.log('POST SECRETARIATES: Base64 data length:', base64Data.length);
            console.log('POST SECRETARIATES: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
            
            // Validate base64 data
            if (!base64Data || base64Data.length < 100) {
                console.log('POST SECRETARIATES: Base64 data is too short or empty');
                throw new Error('Invalid base64 image data');
            }
            
            try {
                imageBuffer = Buffer.from(base64Data, 'base64');
                console.log('POST SECRETARIATES: Buffer created successfully');
            } catch (bufferError) {
                console.log('POST SECRETARIATES: Failed to create buffer from base64:', bufferError.message);
                throw new Error('Failed to process base64 image data');
            }
            
            // Use exact original filename or fallback
            fileName = originalFilename || `secretariat_${Date.now()}.jpg`;
            mimeType = mimeTypeFromUrl || 'image/jpeg';
            
            console.log('POST SECRETARIATES: Using filename:', fileName);
            console.log('POST SECRETARIATES: MIME type:', mimeType);
            console.log('POST SECRETARIATES: Buffer size:', imageBuffer.length);
            console.log('POST SECRETARIATES: Buffer is valid:', imageBuffer && imageBuffer.length > 0);
        } else if (pfp && pfp.buffer) {
            console.log('POST SECRETARIATES: PFP is file object, processing...');
            imageBuffer = pfp.buffer;
            fileName = pfp.originalname || `secretariat_${Date.now()}.jpg`;
            mimeType = pfp.mimetype || 'image/jpeg';
            
            console.log('POST SECRETARIATES: Original filename:', fileName);
            console.log('POST SECRETARIATES: MIME type:', mimeType);
            console.log('POST SECRETARIATES: Buffer size:', imageBuffer.length);
        } else {
            console.log('POST SECRETARIATES: Invalid PFP format');
            throw new Error('Invalid image format');
        }

        console.log('POST SECRETARIATES: Uploading to Supabase storage...');
        
        // Debug the buffer before upload
        console.log('POST SECRETARIATES: Pre-upload buffer validation:');
        console.log('POST SECRETARIATES: Buffer length:', imageBuffer.length);
        console.log('POST SECRETARIATES: Buffer start (hex):', imageBuffer.slice(0, 20).toString('hex'));
        console.log('POST SECRETARIATES: Is valid JPEG header:', imageBuffer.slice(0, 3).toString('hex') === 'ffd8ff');
        
        const { data, error } = await supabase.storage
            .from('secretariate-pfp')
            .upload(fileName, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
            });

        if (error) {
            console.log('POST SECRETARIATES: Supabase upload error:', error.message);
            console.log('POST SECRETARIATES: Full error object:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('POST SECRETARIATES: Image uploaded successfully');
        console.log('POST SECRETARIATES: Upload response data:', data);
        console.log('POST SECRETARIATES: Getting public URL...');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('secretariate-pfp')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        console.log('POST SECRETARIATES: Public URL:', publicUrl);
        
        // Test if the file is actually accessible
        try {
            console.log('POST SECRETARIATES: Testing file accessibility...');
            
            // List all files in bucket to see if our file is there
            const { data: listData, error: listError } = await supabase.storage
                .from('secretariate-pfp')
                .list('', { limit: 100 });
            
            if (listError) {
                console.log('POST SECRETARIATES: Failed to list files:', listError.message);
            } else {
                console.log('POST SECRETARIATES: Files in bucket:', listData.map(file => `${file.name} (${file.metadata?.size || 'unknown size'})`));
                const ourFile = listData.find(file => file.name === fileName);
                if (ourFile) {
                    console.log('POST SECRETARIATES: Our file found in bucket:', ourFile);
                } else {
                    console.log('POST SECRETARIATES: Our file NOT found in bucket listing');
                }
            }
            
            // Try to download the file
            const { data: downloadData, error: downloadError } = await supabase.storage
                .from('secretariate-pfp')
                .download(fileName);
            
            if (downloadError) {
                console.log('POST SECRETARIATES: File download test failed:', downloadError.message);
            } else {
                console.log('POST SECRETARIATES: File is accessible, size:', downloadData.size);
                console.log('POST SECRETARIATES: Downloaded file type:', downloadData.type);
                
                // Convert to buffer and check first few bytes
                const arrayBuffer = await downloadData.arrayBuffer();
                const downloadedBuffer = Buffer.from(arrayBuffer);
                console.log('POST SECRETARIATES: Downloaded buffer start (hex):', downloadedBuffer.slice(0, 20).toString('hex'));
                console.log('POST SECRETARIATES: Downloaded vs uploaded match:', downloadedBuffer.equals(imageBuffer));
            }
        } catch (testError) {
            console.log('POST SECRETARIATES: File accessibility test error:', testError.message);
        }
        }

        console.log('POST SECRETARIATES: Inserting into database...');
        const result = await pool.query(
            'INSERT INTO secretariates (name, title, description, pfp_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, title, description, pfp ? publicUrl : pfp] // Use uploaded URL or default
        );
        
        console.log('POST SECRETARIATES: Created successfully with ID:', result.rows[0].id);
        
        // Fetch all secretariates with proper ordering
        const allSecretariates = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
        res.status(201).json({ secretariate: allSecretariates.rows, message: 'Secretariate created successfully' });
    } catch (error) {
        console.error('POST SECRETARIATES: Error creating secretariate:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Update a secretariate
exports.updateSecretariate = async (req, res) => {
    console.log('PUT SECRETARIATES: Update secretariate request received');
    console.log('PUT SECRETARIATES: ID:', req.params.id);
    console.log('PUT SECRETARIATES: Name:', req.body.name);
    console.log('PUT SECRETARIATES: Title:', req.body.title);
    console.log('PUT SECRETARIATES: Description length:', req.body.description ? req.body.description.length : 0);
    console.log('PUT SECRETARIATES: New PFP provided:', !!req.body.pfp);
    console.log('PUT SECRETARIATES: PFP type:', typeof req.body.pfp);
    console.log('PUT SECRETARIATES: PFP value (first 100 chars):', req.body.pfp);
    console.log('PUT SECRETARIATES: Order num:', req.body.order_num);
    
    const { id } = req.params;
    const { name, title, description, pfp, order_num } = req.body;

    try {
        // First, get the current record to compare with new data
        console.log('PUT SECRETARIATES: Fetching current record for comparison...');
        const currentRecord = await pool.query('SELECT * FROM secretariates WHERE id = $1', [id]);
        
        if (currentRecord.rows.length === 0) {
            console.log('PUT SECRETARIATES: Secretariate with ID', id, 'not found\n');
            return res.status(404).json({ message: 'Secretariate not found' });
        }

        const current = currentRecord.rows[0];
        console.log('PUT SECRETARIATES: Current record:', {
            name: current.name,
            title: current.title,
            description: current.description ? `${current.description.length} chars` : 'NULL',
            pfp_url: current.pfp_url,
            order_num: current.order_num
        });

        // Build update fields and values dynamically based on what's actually changed
        const updateFields = [];
        const updateValues = [];
        let valueIndex = 1;

        // Check and update name if it's different
        if (name && name.trim() !== current.name) {
            console.log('PUT SECRETARIATES: Name changed from', `"${current.name}"`, 'to', `"${name.trim()}"`);
            updateFields.push(`name = $${valueIndex}`);
            updateValues.push(name.trim());
            valueIndex++;
        } else {
            console.log('PUT SECRETARIATES: Name unchanged, keeping existing value');
        }

        // Check and update title if it's different
        if (title && title.trim() !== current.title) {
            console.log('PUT SECRETARIATES: Title changed from', `"${current.title}"`, 'to', `"${title.trim()}"`);
            updateFields.push(`title = $${valueIndex}`);
            updateValues.push(title.trim());
            valueIndex++;
        } else {
            console.log('PUT SECRETARIATES: Title unchanged, keeping existing value');
        }

        // Check and update description if it's different
        if (description && description.trim() !== current.description) {
            console.log('PUT SECRETARIATES: Description changed from', `${current.description ? current.description.length : 0} chars`, 'to', `${description.trim().length} chars`);
            updateFields.push(`description = $${valueIndex}`);
            updateValues.push(description.trim());
            valueIndex++;
        } else {
            console.log('PUT SECRETARIATES: Description unchanged, keeping existing value');
        }

        // Handle order_num changes with automatic swapping
        let orderChanged = false;
        if (order_num !== undefined && order_num !== current.order_num) {
            console.log('PUT SECRETARIATES: Order number changed from', current.order_num, 'to', order_num);
            console.log('PUT SECRETARIATES: Using swap function to handle order conflicts...');
            
            // Use the SQL function to handle order swapping
            await pool.query('SELECT swap_secretariate_order($1, $2)', [id, order_num]);
            orderChanged = true;
            console.log('PUT SECRETARIATES: Order swap completed successfully');
        } else {
            console.log('PUT SECRETARIATES: Order number unchanged, keeping existing value');
        }

        // Handle image upload only if new image is provided
        let newPublicUrl = null;
        if (pfp !== current.pfp_url) {
            console.log('PUT SECRETARIATES: Processing new image upload...');
            
            // Handle base64 image data from frontend
            let imageBuffer, fileName, mimeType;
            
            if (typeof pfp === 'string') {
                console.log('PUT SECRETARIATES: PFP is base64 string, processing...');
                console.log('PUT SECRETARIATES: Raw PFP string length:', pfp.length);
                console.log('PUT SECRETARIATES: PFP string start (first 150 chars):', pfp.substring(0, 150));
                
                // Extract filename from data URL if present
                let originalFilename = null;
                const nameMatch = pfp.match(/data:[^;]+;name=([^;]+);/);
                if (nameMatch) {
                    originalFilename = decodeURIComponent(nameMatch[1]);
                    console.log('PUT SECRETARIATES: Original filename found:', originalFilename);
                } else {
                    console.log('PUT SECRETARIATES: No filename found in data URL');
                }
                
                // Check if the data URL is properly formatted
                const dataUrlMatch = pfp.match(/^data:([^;]+);(name=[^;]+;)?base64,(.+)$/);
                if (!dataUrlMatch) {
                    console.log('PUT SECRETARIATES: Invalid data URL format');
                    console.log('PUT SECRETARIATES: Expected format: data:mime/type;name=filename;base64,data');
                    throw new Error('Invalid base64 data URL format');
                }
                
                const mimeTypeFromUrl = dataUrlMatch[1];
                const base64Data = dataUrlMatch[3];
                
                console.log('PUT SECRETARIATES: Extracted MIME type:', mimeTypeFromUrl);
                console.log('PUT SECRETARIATES: Base64 data length:', base64Data.length);
                console.log('PUT SECRETARIATES: Base64 data start (first 50 chars):', base64Data.substring(0, 50));
                
                // Validate base64 data
                if (!base64Data || base64Data.length < 100) {
                    console.log('PUT SECRETARIATES: Base64 data is too short or empty');
                    throw new Error('Invalid base64 image data');
                }
                
                try {
                    imageBuffer = Buffer.from(base64Data, 'base64');
                    console.log('PUT SECRETARIATES: Buffer created successfully');
                } catch (bufferError) {
                    console.log('PUT SECRETARIATES: Failed to create buffer from base64:', bufferError.message);
                    throw new Error('Failed to process base64 image data');
                }
                
                // Use exact original filename or fallback
                fileName = originalFilename || `secretariat_${Date.now()}.jpg`;
                mimeType = mimeTypeFromUrl || 'image/jpeg';
                
                console.log('PUT SECRETARIATES: Using filename:', fileName);
                console.log('PUT SECRETARIATES: MIME type:', mimeType);
                console.log('PUT SECRETARIATES: Buffer size:', imageBuffer.length);
                console.log('PUT SECRETARIATES: Buffer is valid:', imageBuffer && imageBuffer.length > 0);
            } else if (pfp && pfp.buffer) {
                console.log('PUT SECRETARIATES: PFP is file object, processing...');
                imageBuffer = pfp.buffer;
                fileName = pfp.originalname || `secretariat_${Date.now()}.jpg`;
                mimeType = pfp.mimetype || 'image/jpeg';
                
                console.log('PUT SECRETARIATES: Original filename:', fileName);
                console.log('PUT SECRETARIATES: MIME type:', mimeType);
                console.log('PUT SECRETARIATES: Buffer size:', imageBuffer.length);
            } else {
                console.log('PUT SECRETARIATES: Invalid PFP format');
                throw new Error('Invalid image format');
            }

            console.log('PUT SECRETARIATES: Uploading to Supabase storage...');
            const { data, error } = await supabase.storage
                .from('secretariate-pfp')
                .upload(fileName, imageBuffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: mimeType
                });

            if (error) {
                console.log('PUT SECRETARIATES: Supabase upload error:', error.message);
                throw error;
            }

            console.log('PUT SECRETARIATES: New image uploaded successfully');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('secretariate-pfp')
                .getPublicUrl(fileName);

            newPublicUrl = publicUrlData.publicUrl;
            console.log('PUT SECRETARIATES: New Public URL:', newPublicUrl);
            console.log('PUT SECRETARIATES: Image URL changed from', current.pfp_url ? 'existing URL' : 'NULL', 'to new URL');
            
            updateFields.push(`pfp_url = $${valueIndex}`);
            updateValues.push(newPublicUrl);
            valueIndex++;
        } else {
            console.log('PUT SECRETARIATES: No new image provided, keeping existing image');
        }

        // Check if any fields need to be updated (excluding order_num which is handled separately)
        if (updateFields.length === 0 && !orderChanged) {
            console.log('PUT SECRETARIATES: No changes detected, returning current data without database update\n');
            const allSecretariates = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
            return res.status(200).json({ secretariate: allSecretariates.rows, message: 'No changes detected' });
        }

        // Only run the update query if there are fields to update (other than order_num)
        if (updateFields.length > 0) {
            // Always update the updated_at timestamp when any field changes
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            
            // Add the ID parameter for the WHERE clause
            updateValues.push(id);
            const whereClauseIndex = valueIndex;

            const updateQuery = `UPDATE secretariates SET ${updateFields.join(', ')} WHERE id = $${whereClauseIndex} RETURNING *`;
            
            console.log('PUT SECRETARIATES: Executing selective update...');
            console.log('PUT SECRETARIATES: Update query:', updateQuery);
            console.log('PUT SECRETARIATES: Update values:', updateValues);
            
            const result = await pool.query(updateQuery, updateValues);
            console.log('PUT SECRETARIATES: Updated successfully with selective changes');
        } else if (orderChanged) {
            console.log('PUT SECRETARIATES: Only order number was changed (handled by swap function)');
        }
        
        // Fetch all secretariates with proper ordering
        const allSecretariates = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
        res.status(200).json({ secretariate: allSecretariates.rows, message: 'Secretariate updated successfully' });
    } catch (error) {
        console.error('PUT SECRETARIATES: Error updating secretariate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update secretariate positions in bulk
exports.updateSecretariatePositions = async (req, res) => {
    console.log('PUT SECRETARIATES BULK: Bulk position update request received');
    console.log('PUT SECRETARIATES BULK: Update data:', req.body);
    
    const { secretariates } = req.body;

    if (!secretariates || !Array.isArray(secretariates)) {
        console.log('PUT SECRETARIATES BULK: Invalid secretariates data\n');
        return res.status(400).json({ message: 'Invalid secretariates data' });
    }

    try {
        console.log('PUT SECRETARIATES BULK: Starting transaction for bulk update...');
        
        await pool.query('BEGIN');

        // First, temporarily set all order_num to negative values to avoid conflicts
        console.log('PUT SECRETARIATES BULK: Setting temporary order values...');
        for (let i = 0; i < secretariates.length; i++) {
            const { id } = secretariates[i];
            await pool.query('UPDATE secretariates SET order_num = $1 WHERE id = $2', [-(i + 1), id]);
        }

        // Then update to final order values
        console.log('PUT SECRETARIATES BULK: Setting final order values...');
        for (let i = 0; i < secretariates.length; i++) {
            const { id } = secretariates[i];
            const newOrderNum = i + 1;
            await pool.query('UPDATE secretariates SET order_num = $1 WHERE id = $2', [newOrderNum, id]);
        }

        await pool.query('COMMIT');
        console.log('PUT SECRETARIATES BULK: Bulk update completed successfully');
        
        // Fetch all secretariates with proper ordering
        const allSecretariates = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
        res.status(200).json({ secretariate: allSecretariates.rows, message: 'Secretariate positions updated successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('PUT SECRETARIATES BULK: Error updating positions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a secretariate
exports.deleteSecretariate = async (req, res) => {
    console.log('DELETE SECRETARIATES: Delete secretariate request received');
    console.log('DELETE SECRETARIATES: ID:', req.params.id);
    
    const { id } = req.params;

    try {
        // First, get the record to find the image URL before deletion
        console.log('DELETE SECRETARIATES: Fetching record to get image URL...');
        const recordResult = await pool.query('SELECT * FROM secretariates WHERE id = $1', [id]);

        if (recordResult.rows.length === 0) {
            console.log('DELETE SECRETARIATES: Secretariate with ID', id, 'not found\n');
            return res.status(404).json({ message: 'Secretariate not found' });
        }

        const secretariatRecord = recordResult.rows[0];
        console.log('DELETE SECRETARIATES: Found record for:', secretariatRecord.name);
        console.log('DELETE SECRETARIATES: Image URL:', secretariatRecord.pfp_url);

        // Extract filename from the Supabase URL if it exists
        let filenameToDelete = null;
        if (secretariatRecord.pfp_url) {
            // Extract filename from Supabase URL (e.g., https://...supabase.../secretariate-pfp/filename.jpg)
            const urlParts = secretariatRecord.pfp_url.split('/');
            filenameToDelete = urlParts[urlParts.length - 1];
            console.log('DELETE SECRETARIATES: Extracted filename for deletion:', filenameToDelete);
        }

        // Delete from database first
        console.log('DELETE SECRETARIATES: Deleting from database...');
        const deleteResult = await pool.query('DELETE FROM secretariates WHERE id = $1 RETURNING *', [id]);

        // Delete image from Supabase storage if it exists
        if (filenameToDelete) {
            console.log('DELETE SECRETARIATES: Removing image from Supabase storage...');
            const { data, error } = await supabase.storage
                .from('secretariate-pfp')
                .remove([filenameToDelete]);

            if (error) {
                console.log('DELETE SECRETARIATES: Warning - Failed to delete image from storage:', error.message);
                // Don't fail the whole operation if image deletion fails
            } else {
                console.log('DELETE SECRETARIATES: Image deleted from storage successfully');
            }
        } else {
            console.log('DELETE SECRETARIATES: No image to delete from storage');
        }

        console.log('DELETE SECRETARIATES: Deleted successfully:', secretariatRecord.name);
        
        // Fetch all secretariates with proper ordering
        const allSecretariates = await pool.query('SELECT * FROM secretariates ORDER BY order_num ASC');
        res.status(200).json({ secretariate: allSecretariates.rows, message: 'Secretariate deleted successfully' });
    } catch (error) {
        console.error('DELETE SECRETARIATES: Error deleting secretariate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};