const pool = require('../config/db');

// Get all schools
exports.getAllSchools = async (req, res) => {
    console.log('GET SCHOOLS: Function called - schools data retrieval request received');
    
    try {
        console.log('GET SCHOOLS: Database query execution started for all schools');
        const result = await pool.query('SELECT * FROM schools');
        console.log('GET SCHOOLS: Database query successful - school count retrieved:', result.rows.length);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('GET SCHOOLS: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// register a new school
exports.registerSchool = async (req, res) => {
    console.log('POST SCHOOLS: Function called - school registration request received');
    console.log('POST SCHOOLS: Request data validation initiated');
    
    const { personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo } = req.body;

    if(!personEmail || !schoolName || !numDelegates || !headDName || !headDCP || !primEmail) {
        console.log('POST SCHOOLS: Required field validation failed - missing data');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('POST SCHOOLS: Duplicate school name validation initiated');
    const existingSchool = await pool.query('SELECT * FROM schools WHERE school_name = $1', [schoolName]);

    if (existingSchool.rows.length > 0) {
        console.log('POST SCHOOLS: Duplicate school name detected - registration rejected\n');
        return res.status(400).json({ message: 'School with this name already exists' });
    }

    try {
        console.log('POST SCHOOLS: Database school insertion initiated');
        const result = await pool.query(
            'INSERT INTO schools (person_email, school_name, num_delegates, head_delegate_name, head_delegate_contact_phone, primary_email, extra_info) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo]
        );
        
        console.log('POST SCHOOLS: School registration completed successfully - ID:', result.rows[0].id);
        console.log('POST SCHOOLS: Notification email process initiated');
        res.status(201).json({ result: result.rows[0], message: 'School registered successfully' });
    } catch (error) {
        console.error('POST SCHOOLS: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// fetch the registration status
exports.getRegistrationStatus = async (req, res) => {
    console.log('GET SCHOOLS: Function called - registration status retrieval request received');

    try {
        console.log('GET SCHOOLS: Database query execution started for registration status');
        const result = await pool.query('SELECT is_open FROM registration WHERE id = 1');
        if (result.rows.length === 0) {
            console.log('GET SCHOOLS: No registration status found in database\n');
            return res.status(404).json({ message: 'Registration status not found' });
        }

        const isOpen = result.rows[0].is_open;
        console.log('GET SCHOOLS: Registration status retrieval successful - status:', isOpen ? 'OPEN' : 'CLOSED');
        res.status(200).json({ isOpen });
    } catch (error) {
        console.error('GET SCHOOLS: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Opens or closes the registration
exports.changeRegistrationStatus = async (req, res) => {
    console.log('PUT SCHOOLS: Function called - registration status change request received');
    
    const { status } = req.body;
    console.log('PUT SCHOOLS: Status value validation completed');

    if (typeof status !== 'boolean') {
        console.log('PUT SCHOOLS: Invalid status value - must be boolean, received:', typeof status, '\n');
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        console.log('PUT SCHOOLS: Database registration status update initiated');
        
        const result = await pool.query('UPDATE registration SET is_open = $1 WHERE id = 1', [status]);
        
        console.log('PUT SCHOOLS: Registration status update completed successfully');
        console.log('PUT SCHOOLS: Database rows affected:', result.rowCount);
        console.log('PUT SCHOOLS: Registration status set to:', status ? 'OPEN' : 'CLOSED');
        
        res.status(200).json({ message: `Registration ${status ? 'opened' : 'closed'} successfully` });
    } catch (error) {
        console.error('PUT SCHOOLS: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a school
exports.deleteSchool = async (req, res) => {
    console.log('DELETE SCHOOLS: Function called - school deletion request received');
    const { id } = req.params;

    try {
        console.log('DELETE SCHOOLS: School existence validation initiated for ID:', id);
        const existingSchool = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (existingSchool.rows.length === 0) {
            console.log('DELETE SCHOOLS: School not found for deletion - ID:', id, '\n');
            return res.status(404).json({ message: 'School not found' });
        }

        console.log('DELETE SCHOOLS: Database school deletion initiated');
        await pool.query('DELETE FROM schools WHERE id = $1', [id]);

        console.log('DELETE SCHOOLS: School deletion completed successfully');
        res.status(200).json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('DELETE SCHOOLS: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};