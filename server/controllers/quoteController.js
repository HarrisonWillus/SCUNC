const pool = require('../config/db');

// get all quotes
exports.getAllQuotes = async (req, res) => {
    console.log('GET QUOTE: Function called - quotes retrieval request received');
    try {
        console.log('GET QUOTE: Database query execution started for quotes with secretariate data');
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
        console.log('GET QUOTE: Database query successful - quotes retrieved\n');
        res.json(result.rows);
    } catch (error) {
        console.error('GET QUOTE: Function failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Adds a new quote
exports.addQuote = async (req, res) => {
    console.log('ADD QUOTE: Function called - quote creation request received');
    const { title, text, name, position, person_id } = req.body;
    
    try {
        let quoteData = { title, text, name, position };
        
        // If person_id is provided, fetch data from secretariates table
        if (person_id) {
            console.log('ADD QUOTE: Secretariate data retrieval initiated for person_id:', person_id);
            
            const secretariateResult = await pool.query(
                'SELECT name, title, pfp_url FROM secretariates WHERE id = $1',
                [person_id]
            );
            
            if (secretariateResult.rows.length > 0) {
                const secretariate = secretariateResult.rows[0];
                console.log('ADD QUOTE: Secretariate data retrieval successful');
                
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
                console.log('ADD QUOTE: Secretariate not found for person_id:', person_id, '\n');
                return res.status(404).json({ error: 'Secretariate not found with provided person_id' });
            }
        }
        
        console.log('ADD QUOTE: Database quote insertion initiated');
        
        const result = await pool.query(
            'INSERT INTO quotes (title, quote, name, position, picture_url, person_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [quoteData.title, quoteData.text, quoteData.name, quoteData.position, quoteData.picture_url || null, quoteData.person_id || null]
        );
        
        console.log('ADD QUOTE: Quote creation completed successfully\n');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('ADD QUOTE: Function failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get quotes by person_id (secretariate)
exports.getQuotesByPersonId = async (req, res) => {
    console.log('GET QUOTES BY PERSON ID: Function called - quotes by person_id retrieval request received');
    const { person_id } = req.params;
    
    try {
        console.log('GET QUOTES BY PERSON ID: Database query execution started for person_id:', person_id);
        
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
        
        console.log('GET QUOTES BY PERSON ID: Database query successful - found', result.rows.length, 'quotes\n');
        res.json(result.rows);
    } catch (error) {
        console.error('GET QUOTES BY PERSON ID: Function failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update a quote
exports.updateQuote = async (req, res) => {
    console.log('UPDATE QUOTE: Function called - quote update request received');
    const { id } = req.params;
    const { title, text, name, position, person_id } = req.body;
    
    try {
        console.log('UPDATE QUOTE: Quote update processing initiated for ID:', id);
        
        let quoteData = { title, text, name, position };
        
        // If person_id is provided, fetch fresh data from secretariates table
        if (person_id) {
            console.log('UPDATE QUOTE: Updated secretariate data retrieval initiated for person_id:', person_id);
            
            const secretariateResult = await pool.query(
                'SELECT name, title, pfp_url FROM secretariates WHERE id = $1',
                [person_id]
            );
            
            if (secretariateResult.rows.length > 0) {
                const secretariate = secretariateResult.rows[0];
                console.log('UPDATE QUOTE: Updated secretariate data retrieval successful');
                
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
                console.log('UPDATE QUOTE: Secretariate not found for person_id:', person_id, '\n');
                return res.status(404).json({ error: 'Secretariate not found with provided person_id' });
            }
        }
        
        console.log('UPDATE QUOTE: Database quote update initiated');
        const result = await pool.query(
            'UPDATE quotes SET title = $1, quote = $2, name = $3, position = $4, picture_url = $5, person_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [quoteData.title, quoteData.text, quoteData.name, quoteData.position, quoteData.picture_url || null, quoteData.person_id || null, id]
        );
        
        if (result.rows.length === 0) {
            console.log('UPDATE QUOTE: Quote not found for update - ID:', id, '\n');
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        console.log('UPDATE QUOTE: Quote update completed successfully\n');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('UPDATE QUOTE: Function failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a quote
exports.deleteQuote = async (req, res) => {
    console.log('DELETE QUOTE: Function called - quote deletion request received');
    const { id } = req.params;
    
    try {
        console.log('DELETE QUOTE: Database quote deletion initiated for ID:', id);
        
        const result = await pool.query('DELETE FROM quotes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            console.log('DELETE QUOTE: Quote not found for deletion - ID:', id, '\n');
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        console.log('DELETE QUOTE: Quote deletion completed successfully\n');
        res.json({ message: 'Quote deleted successfully', quote: result.rows[0] });
    } catch (error) {
        console.error('DELETE QUOTE: Function failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Internal Server Error' });
    }
};