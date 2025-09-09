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
    console.log('POST SECRETARIATES: Request Content-Type:', req.headers['content-type']);
    console.log('POST SECRETARIATES: Request body:', req.body);
    console.log('POST SECRETARIATES: Request file:', req.file);
    
    const { name, title, description } = req.body;

    if (!name || !title || !description) {
        console.log('POST SECRETARIATES: Missing required fields\n');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let publicUrl = null;
        
        // Handle file upload from multer
        if (req.file) {
            console.log('POST SECRETARIATES: Processing file upload...');
            console.log('POST SECRETARIATES: File details:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            
            const fileName = `secretariat_${Date.now()}_${req.file.originalname}`;
            const { data, error } = await supabase.storage
                .from('secretariate-pfp')
                .upload(fileName, req.file.buffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: req.file.mimetype
                });

            if (error) {
                console.log('POST SECRETARIATES: Supabase upload error:', error.message);
                throw error;
            }

            console.log('POST SECRETARIATES: Image uploaded successfully');
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('secretariate-pfp')
                .getPublicUrl(fileName);

            publicUrl = publicUrlData.publicUrl;
            console.log('POST SECRETARIATES: Public URL:', publicUrl);
        } else {
            // Use default image if no file provided
            publicUrl = 'https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png';
            console.log('POST SECRETARIATES: No file provided, using default image URL');
        }

        console.log('POST SECRETARIATES: Inserting into database...');
        const result = await pool.query(
            'INSERT INTO secretariates (name, title, description, pfp_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name.trim(), title.trim(), description.trim(), publicUrl]
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
    console.log('PUT SECRETARIATES: Request body:', req.body);
    console.log('PUT SECRETARIATES: Request file:', req.file);
    console.log('PUT SECRETARIATES: Request pfp value:', req.body.pfp);
    
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

        // Handle image upload only if new file is provided
        let newPublicUrl = null;

        if (req.file) {
            console.log('PUT SECRETARIATES: Processing new file upload...');
            console.log('PUT SECRETARIATES: File details:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            
            const fileName = `secretariat_${Date.now()}_${req.file.originalname}`;
            const { data, error } = await supabase.storage
                .from('secretariate-pfp')
                .upload(fileName, req.file.buffer, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: req.file.mimetype
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
        } else if (pfp && pfp !== current.pfp_url) {
            // Handle case where pfp URL is provided (not a file upload)
            console.log('PUT SECRETARIATES: Using provided PFP URL');
            updateFields.push(`pfp_url = $${valueIndex}`);
            updateValues.push(pfp);
            valueIndex++;
        } else if (!pfp) {
            // Explicitly setting to default (when user clicks "remove photo")
            newPublicUrl = 'https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png';
            updateFields.push(`pfp_url = $${valueIndex}`);
            updateValues.push(newPublicUrl);
            valueIndex++;
            console.log('PUT SECRETARIATES: Setting to default image (photo removed)');
        } else {
            // No pfp parameter sent, keep existing image
            console.log('PUT SECRETARIATES: No image changes, keeping existing image');
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