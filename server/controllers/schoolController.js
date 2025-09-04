const pool = require('../config/db');

// Get all schools
exports.getAllSchools = async (req, res) => {
    console.log('🏫 SCHOOLS: GET all schools request received');
    
    try {
        console.log('🔍 SCHOOLS: Querying database for all schools...');
        const result = await pool.query('SELECT * FROM schools');
        console.log('✅ SCHOOLS: Found', result.rows.length, 'schools');
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('💥 SCHOOLS: Error fetching schools:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// register a new school
exports.registerSchool = async (req, res) => {
    console.log('🏫 SCHOOLS: School registration request received');
    console.log('📧 Person Email:', req.body.personEmail);
    console.log('🏫 School Name:', req.body.schoolName);
    console.log('👥 Number of Delegates:', req.body.numDelegates);
    
    const { personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo } = req.body;

    if(!personEmail || !schoolName || !numDelegates || !headDName || !headDCP || !primEmail) {
        console.log('❌ SCHOOLS: Missing required fields');
        return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('🔍 SCHOOLS: Checking if school already exists...');
    const existingSchool = await pool.query('SELECT * FROM schools WHERE school_name = $1', [schoolName]);

    if (existingSchool.rows.length > 0) {
        console.log('❌ SCHOOLS: School with name', schoolName, 'already exists');
        return res.status(400).json({ message: 'School with this name already exists' });
    }

    try {
        console.log('💾 SCHOOLS: Inserting new school into database...');
        const result = await pool.query(
            'INSERT INTO schools (person_email, school_name, num_delegates, head_delegate_name, head_delegate_contact_phone, primary_email, extra_info) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [personEmail, schoolName, numDelegates, headDName, headDCP, primEmail, extraInfo]
        );
        
        console.log('✅ SCHOOLS: School registered successfully with ID:', result.rows[0].id);
        console.log('📧 SCHOOLS: Sending notification email...');
        res.status(201).json({ result: result.rows[0], message: 'School registered successfully' });
    } catch (error) {
        console.error('💥 SCHOOLS: Error registering school:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// fetch the registration status
exports.getRegistrationStatus = async (req, res) => {
    console.log('🔍 SCHOOLS: Fetch registration status request received');

    try {
        const result = await pool.query('SELECT is_open FROM registration WHERE id = 1');
        if (result.rows.length === 0) {
            console.log('❌ SCHOOLS: No registration status found');
            return res.status(404).json({ message: 'Registration status not found' });
        }

        const isOpen = result.rows[0].is_open;
        console.log('📊 SCHOOLS: Registration is currently', isOpen ? 'OPEN' : 'CLOSED');
        res.status(200).json({ isOpen });
    } catch (error) {
        console.error('💥 SCHOOLS: Error fetching registration status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Opens or closes the registration
exports.changeRegistrationStatus = async (req, res) => {
    console.log('🔄 SCHOOLS: Registration status change request received');
    console.log('📥 SCHOOLS: Request body:', req.body);
    
    const { status } = req.body;
    console.log('📊 SCHOOLS: Status value:', status, 'Type:', typeof status);

    if (typeof status !== 'boolean') {
        console.log('❌ SCHOOLS: Invalid status value - must be boolean, received:', typeof status);
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        console.log('🔍 SCHOOLS: Updating registration status in database...');
        console.log('💾 SCHOOLS: Setting is_open =', status, 'for registration id = 1');
        
        const result = await pool.query('UPDATE registration SET is_open = $1 WHERE id = 1', [status]);
        
        console.log('✅ SCHOOLS: Database update successful');
        console.log('📊 SCHOOLS: Rows affected:', result.rowCount);
        console.log('🎯 SCHOOLS: Registration is now', status ? 'OPEN' : 'CLOSED');
        
        res.status(200).json({ message: `Registration ${status ? 'opened' : 'closed'} successfully` });
    } catch (error) {
        console.error('💥 SCHOOLS: Error changing registration status:', error);
        console.error('🔍 SCHOOLS: Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a school
exports.deleteSchool = async (req, res) => {
    console.log('🗑️ SCHOOLS: Delete school request received');
    const { id } = req.params;

    try {
        console.log('🔍 SCHOOLS: Checking if school exists with ID:', id);
        const existingSchool = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (existingSchool.rows.length === 0) {
            console.log('❌ SCHOOLS: No school found with ID:', id);
            return res.status(404).json({ message: 'School not found' });
        }

        console.log('💾 SCHOOLS: Deleting school with ID:', id);
        await pool.query('DELETE FROM schools WHERE id = $1', [id]);

        console.log('✅ SCHOOLS: School deleted successfully');
        res.status(200).json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('💥 SCHOOLS: Error deleting school:', error);
        res.status(500).json({ message: 'Server error' });
    }
};