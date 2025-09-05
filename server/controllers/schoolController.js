const pool = require('../config/db');

// Get all schools
exports.getAllSchools = async (req, res) => {
    console.log('Step 1: GET all schools request received and processing');
    
    try {
        console.log('Step 2: Querying database for all schools data');
        const result = await pool.query('SELECT * FROM schools');
        console.log('Step 3: Successfully found school count:', result.rows.length);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Step 4: Error occurred while fetching schools:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// register a new school
exports.registerSchool = async (req, res) => {
    console.log('Step 1: School registration request received and processing');
    console.log('Step 2: Person email validation:', req.body.personEmail);
    console.log('Step 3: School name verification:', req.body.schoolName);
    console.log('Step 4: Number of delegates check:', req.body.numDelegates);
    
    const { personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo } = req.body;

    if(!personEmail || !schoolName || !numDelegates || !headDName || !headDCP || !primEmail) {
        console.log('Step 5: Required fields validation failed');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('Step 6: Checking for existing school with same name');
    const existingSchool = await pool.query('SELECT * FROM schools WHERE school_name = $1', [schoolName]);

    if (existingSchool.rows.length > 0) {
        console.log('Step 7: School with name already exists:', schoolName);
        return res.status(400).json({ message: 'School with this name already exists' });
    }

    try {
        console.log('Step 8: Inserting new school into database');
        const result = await pool.query(
            'INSERT INTO schools (person_email, school_name, num_delegates, head_delegate_name, head_delegate_contact_phone, primary_email, extra_info) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo]
        );
        
        console.log('Step 9: School registered successfully with ID:', result.rows[0].id);
        console.log('Step 10: Sending notification email process initiated');
        res.status(201).json({ result: result.rows[0], message: 'School registered successfully' });
    } catch (error) {
        console.error('Step 11: Error occurred while registering school:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// fetch the registration status
exports.getRegistrationStatus = async (req, res) => {
    console.log('Step 1: Fetch registration status request received and processing');

    try {
        const result = await pool.query('SELECT is_open FROM registration WHERE id = 1');
        if (result.rows.length === 0) {
            console.log('Step 2: No registration status found in database');
            return res.status(404).json({ message: 'Registration status not found' });
        }

        const isOpen = result.rows[0].is_open;
        console.log('Step 3: Registration status currently set to:', isOpen ? 'OPEN' : 'CLOSED');
        res.status(200).json({ isOpen });
    } catch (error) {
        console.error('Step 4: Error occurred while fetching registration status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Opens or closes the registration
exports.changeRegistrationStatus = async (req, res) => {
    console.log('Step 1: Registration status change request received and processing');
    console.log('Step 2: Request body analysis:', req.body);
    
    const { status } = req.body;
    console.log('Step 3: Status value verification:', status, 'Type:', typeof status);

    if (typeof status !== 'boolean') {
        console.log('Step 4: Invalid status value detected - must be boolean, received:', typeof status);
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        console.log('Step 5: Updating registration status in database');
        console.log('Step 6: Setting is_open field to:', status, 'for registration id = 1');
        
        const result = await pool.query('UPDATE registration SET is_open = $1 WHERE id = 1', [status]);
        
        console.log('Step 7: Database update completed successfully');
        console.log('Step 8: Rows affected by update:', result.rowCount);
        console.log('Step 9: Registration status now set to:', status ? 'OPEN' : 'CLOSED');
        
        res.status(200).json({ message: `Registration ${status ? 'opened' : 'closed'} successfully` });
    } catch (error) {
        console.error('Step 10: Error occurred while changing registration status:', error);
        console.error('Step 11: Error details analysis:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a school
exports.deleteSchool = async (req, res) => {
    console.log('Step 1: Delete school request received and processing');
    const { id } = req.params;

    try {
        console.log('Step 2: Checking if school exists with ID:', id);
        const existingSchool = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (existingSchool.rows.length === 0) {
            console.log('Step 3: No school found with ID:', id);
            return res.status(404).json({ message: 'School not found' });
        }

        console.log('Step 4: Deleting school from database with ID:', id);
        await pool.query('DELETE FROM schools WHERE id = $1', [id]);

        console.log('Step 5: School deleted successfully');
        res.status(200).json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Step 6: Error occurred while deleting school:', error);
        res.status(500).json({ message: 'Server error' });
    }
};