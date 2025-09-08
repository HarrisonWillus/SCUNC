const pool = require('../config/db');

// Get all schools
exports.getAllSchools = async (req, res) => {
    console.log('schoolController.getAllSchools: Function called - schools data retrieval request received');
    
    try {
        console.log('schoolController.getAllSchools: Database query execution started for all schools');
        const result = await pool.query('SELECT * FROM schools');
        console.log('schoolController.getAllSchools: Database query successful - school count retrieved:', result.rows.length);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('schoolController.getAllSchools: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// register a new school
exports.registerSchool = async (req, res) => {
    console.log('schoolController.registerSchool: Function called - school registration request received');
    console.log('schoolController.registerSchool: Request data validation initiated');
    
    const { personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo } = req.body;

    if(!personEmail || !schoolName || !numDelegates || !headDName || !headDCP || !primEmail) {
        console.log('schoolController.registerSchool: Required field validation failed - missing data');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('schoolController.registerSchool: Duplicate school name validation initiated');
    const existingSchool = await pool.query('SELECT * FROM schools WHERE school_name = $1', [schoolName]);

    if (existingSchool.rows.length > 0) {
        console.log('schoolController.registerSchool: Duplicate school name detected - registration rejected');
        return res.status(400).json({ message: 'School with this name already exists' });
    }

    try {
        console.log('schoolController.registerSchool: Database school insertion initiated');
        const result = await pool.query(
            'INSERT INTO schools (person_email, school_name, num_delegates, head_delegate_name, head_delegate_contact_phone, primary_email, extra_info) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo]
        );
        
        console.log('schoolController.registerSchool: School registration completed successfully - ID:', result.rows[0].id);
        console.log('schoolController.registerSchool: Notification email process initiated');
        res.status(201).json({ result: result.rows[0], message: 'School registered successfully' });
    } catch (error) {
        console.error('schoolController.registerSchool: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// fetch the registration status
exports.getRegistrationStatus = async (req, res) => {
    console.log('schoolController.getRegistrationStatus: Function called - registration status retrieval request received');

    try {
        console.log('schoolController.getRegistrationStatus: Database query execution started for registration status');
        const result = await pool.query('SELECT is_open FROM registration WHERE id = 1');
        if (result.rows.length === 0) {
            console.log('schoolController.getRegistrationStatus: No registration status found in database');
            return res.status(404).json({ message: 'Registration status not found' });
        }

        const isOpen = result.rows[0].is_open;
        console.log('schoolController.getRegistrationStatus: Registration status retrieval successful - status:', isOpen ? 'OPEN' : 'CLOSED');
        res.status(200).json({ isOpen });
    } catch (error) {
        console.error('schoolController.getRegistrationStatus: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Opens or closes the registration
exports.changeRegistrationStatus = async (req, res) => {
    console.log('schoolController.changeRegistrationStatus: Function called - registration status change request received');
    
    const { status } = req.body;
    console.log('schoolController.changeRegistrationStatus: Status value validation completed');

    if (typeof status !== 'boolean') {
        console.log('schoolController.changeRegistrationStatus: Invalid status value - must be boolean, received:', typeof status);
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        console.log('schoolController.changeRegistrationStatus: Database registration status update initiated');
        
        const result = await pool.query('UPDATE registration SET is_open = $1 WHERE id = 1', [status]);
        
        console.log('schoolController.changeRegistrationStatus: Registration status update completed successfully');
        console.log('schoolController.changeRegistrationStatus: Database rows affected:', result.rowCount);
        console.log('schoolController.changeRegistrationStatus: Registration status set to:', status ? 'OPEN' : 'CLOSED');
        
        res.status(200).json({ message: `Registration ${status ? 'opened' : 'closed'} successfully` });
    } catch (error) {
        console.error('schoolController.changeRegistrationStatus: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a school
exports.deleteSchool = async (req, res) => {
    console.log('schoolController.deleteSchool: Function called - school deletion request received');
    const { id } = req.params;

    try {
        console.log('schoolController.deleteSchool: School existence validation initiated for ID:', id);
        const existingSchool = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (existingSchool.rows.length === 0) {
            console.log('schoolController.deleteSchool: School not found for deletion - ID:', id);
            return res.status(404).json({ message: 'School not found' });
        }

        console.log('schoolController.deleteSchool: Database school deletion initiated');
        await pool.query('DELETE FROM schools WHERE id = $1', [id]);

        console.log('schoolController.deleteSchool: School deletion completed successfully');
        res.status(200).json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('schoolController.deleteSchool: Function failed with error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};