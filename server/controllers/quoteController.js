const pool = require('../config/db');

// get all quotes
exports.getAllQuotes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                q.*,
                s.name as secretariate_name,
                s.title as secretariate_title,
                s.pfp_url as secretariate_pfp_url
            FROM quotes q
            LEFT JOIN secretariates s ON q.person_id = s.id
            ORDER BY q.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Adds a new quote
exports.addQuote = async (req, res) => {
    const { title, text, name, position, person_id } = req.body;
    
    try {
        let quoteData = { title, text, name, position };
        
        // If person_id is provided, fetch data from secretariates table
        if (person_id) {
            console.log('🔍 QUOTES: Fetching secretariate data for person_id:', person_id);
            
            const secretariateResult = await pool.query(
                'SELECT name, title, pfp_url FROM secretariates WHERE id = $1',
                [person_id]
            );
            
            if (secretariateResult.rows.length > 0) {
                const secretariate = secretariateResult.rows[0];
                console.log('✅ QUOTES: Found secretariate data:', secretariate);
                
                // Use secretariate data, but allow manual override if provided in request
                quoteData = {
                    title: title || `Quote from ${secretariate.name}`,
                    text: text,
                    name: name || secretariate.name,
                    position: position || secretariate.title,
                    picture_url: secretariate.pfp_url,
                    person_id: person_id
                };
            } else {
                console.log('⚠️ QUOTES: No secretariate found with ID:', person_id);
                return res.status(404).json({ error: 'Secretariate not found with provided person_id' });
            }
        }
        
        console.log('💾 QUOTES: Inserting quote with data:', quoteData);
        
        const result = await pool.query(
            'INSERT INTO quotes (title, quote, name, position, picture_url, person_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [quoteData.title, quoteData.text, quoteData.name, quoteData.position, quoteData.picture_url || null, quoteData.person_id || null]
        );
        
        console.log('✅ QUOTES: Quote added successfully:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('💥 QUOTES: Error adding quote:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get quotes by person_id (secretariate)
exports.getQuotesByPersonId = async (req, res) => {
    const { person_id } = req.params;
    
    try {
        console.log('🔍 QUOTES: Fetching quotes for person_id:', person_id);
        
        const result = await pool.query(`
            SELECT 
                q.*,
                s.name as secretariate_name,
                s.title as secretariate_title,
                s.pfp_url as secretariate_pfp_url
            FROM quotes q
            LEFT JOIN secretariates s ON q.person_id = s.id
            WHERE q.person_id = $1
            ORDER BY q.created_at DESC
        `, [person_id]);
        
        console.log('✅ QUOTES: Found', result.rows.length, 'quotes for person_id:', person_id);
        res.json(result.rows);
    } catch (error) {
        console.error('💥 QUOTES: Error fetching quotes by person_id:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update a quote
exports.updateQuote = async (req, res) => {
    const { id } = req.params;
    const { title, text, name, position, person_id } = req.body;
    
    try {
        console.log('🔄 QUOTES: Updating quote with ID:', id);
        
        let quoteData = { title, text, name, position };
        
        // If person_id is provided, fetch fresh data from secretariates table
        if (person_id) {
            console.log('🔍 QUOTES: Fetching updated secretariate data for person_id:', person_id);
            
            const secretariateResult = await pool.query(
                'SELECT name, title, pfp_url FROM secretariates WHERE id = $1',
                [person_id]
            );
            
            if (secretariateResult.rows.length > 0) {
                const secretariate = secretariateResult.rows[0];
                console.log('✅ QUOTES: Found secretariate data:', secretariate);
                
                // Use secretariate data, but allow manual override if provided in request
                quoteData = {
                    title: title || `Quote from ${secretariate.name}`,
                    text: text,
                    name: name || secretariate.name,
                    position: position || secretariate.title,
                    picture_url: secretariate.pfp_url,
                    person_id: person_id
                };
            } else {
                console.log('⚠️ QUOTES: No secretariate found with ID:', person_id);
                return res.status(404).json({ error: 'Secretariate not found with provided person_id' });
            }
        }
        
        const result = await pool.query(
            'UPDATE quotes SET title = $1, quote = $2, name = $3, position = $4, picture_url = $5, person_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [quoteData.title, quoteData.text, quoteData.name, quoteData.position, quoteData.picture_url || null, quoteData.person_id || null, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        console.log('✅ QUOTES: Quote updated successfully:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('💥 QUOTES: Error updating quote:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a quote
exports.deleteQuote = async (req, res) => {
    const { id } = req.params;
    
    try {
        console.log('🗑️ QUOTES: Deleting quote with ID:', id);
        
        const result = await pool.query('DELETE FROM quotes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        console.log('✅ QUOTES: Quote deleted successfully:', result.rows[0]);
        res.json({ message: 'Quote deleted successfully', quote: result.rows[0] });
    } catch (error) {
        console.error('💥 QUOTES: Error deleting quote:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};