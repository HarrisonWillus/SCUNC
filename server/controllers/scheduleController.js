const pool = require('../config/db');

// =============================================================================
// SCHEDULE MANAGEMENT (Step 1)
// =============================================================================

// Get single schedule with all days and events
exports.getSchedule = async (req, res) => {
    console.log('Step 1: Starting request for single schedule retrieval');
    console.log('Step 2: User authorization info check:', {
        user: req.headers.authorization ? 'Present' : 'None',
        isAdmin: req.user?.isAdmin || false
    });
    
    try {
        const isAdmin = req.user?.isAdmin || false;
        console.log('Step 3: Admin authorization check result:', isAdmin);
        
        // First, let's try a very simple approach to isolate the issue
        console.log('Step 4: Testing database connection functionality');
        const testQuery = await pool.query('SELECT NOW() as current_time');
        console.log('Step 5: Database connection verified successfully:', testQuery.rows[0]);
        
        // Get the single schedule info with minimal query
        console.log('Step 6: Fetching schedule basic information');
        let scheduleQuery = 'SELECT id, name, is_published, release_date FROM schedule';
        if (!isAdmin) {
            scheduleQuery += ' WHERE is_published = true OR release_date <= NOW()';
            console.log('Step 7: Non-admin user detected - applying published filter');
        }
        scheduleQuery += ' LIMIT 1';
        
        console.log('Step 8: Executing schedule query:', scheduleQuery);
        const scheduleResult = await pool.query(scheduleQuery);
        console.log('Step 9: Schedule query result rows count:', scheduleResult.rows.length);
        
        if (scheduleResult.rows.length === 0) {
            console.log('Step 10: No schedule found in database');
            return res.status(404).json({ 
                error: 'Schedule not found',
                debug: { isAdmin, queryUsed: scheduleQuery }
            });
        }
        
        const schedule = scheduleResult.rows[0];
        console.log('Step 11: Successfully found schedule:', {
            id: schedule.id,
            name: schedule.name,
            is_published: schedule.is_published,
            release_date: schedule.release_date
        });
        
        // Try simplified days query first
        console.log('Step 12: Fetching days with simplified query approach');
        const simpleDaysQuery = 'SELECT id, date, label FROM days WHERE schedule_id = $1 ORDER BY date';
        const daysResult = await pool.query(simpleDaysQuery, [schedule.id]);
        console.log('Step 13: Days query result rows count:', daysResult.rows.length);
        
        // For each day, get events separately to avoid complex JSON aggregation
        const daysWithEvents = [];
        for (const day of daysResult.rows) {
            console.log('Step 14: Fetching events for day ID:', day.id);
            const eventsQuery = 'SELECT id, title, start_time, end_time, location, description FROM events WHERE day_id = $1 ORDER BY start_time';
            const eventsResult = await pool.query(eventsQuery, [day.id]);
            
            daysWithEvents.push({
                ...day,
                events: eventsResult.rows
            });
            
            console.log('Step 15: Day processing completed - day ID:', day.id, 'has', eventsResult.rows.length, 'events');
        }
        
        const responseData = {
            id: schedule.id,
            name: schedule.name,
            is_published: schedule.is_published,
            release_date: schedule.release_date,
            days: daysWithEvents
        };
        
        console.log('Step 16: Sending response with days count:', daysWithEvents.length);
        console.log('Step 17: Total events across all days:', daysWithEvents.reduce((sum, day) => sum + day.events.length, 0));
        
        res.json(responseData);
    } catch (error) {
        console.error('Step 18: Database error occurred:', error);
        console.error('Step 19: Error message details:', error.message);
        console.error('Step 20: Error code information:', error.code);
        console.error('Step 21: Error stack trace:', error.stack);
        
        // Send detailed error info for debugging
        res.status(500).json({ 
            error: 'Failed to fetch schedule',
            debug: {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
            }
        });
    }
};

// Create or update the single schedule (Step 1)
exports.createSchedule = async (req, res) => {
    console.log('➕ CREATE_SCHEDULE: Starting schedule creation/update...');
    console.log('📋 CREATE_SCHEDULE: Request body:', req.body);
    console.log('👤 CREATE_SCHEDULE: User info:', req.user);
    
    try {
        const { name, release_date } = req.body;
        
        console.log('📝 CREATE_SCHEDULE: Parsed data:', {
            name: name,
            release_date: release_date,
            nameLength: name ? name.length : 0
        });
        
        if (!release_date) {
            console.log('❌ CREATE_SCHEDULE: Validation failed - missing release_date');
            return res.status(400).json({ error: 'Release date is required' });
        }
        
        const scheduleData = {
            name: name || 'Conference Schedule',
            release_date: release_date
        };
        
        // Check if a schedule already exists
        console.log('� CREATE_SCHEDULE: Checking for existing schedule...');
        const existingResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        let result;
        if (existingResult.rows.length > 0) {
            // Update existing schedule
            const scheduleId = existingResult.rows[0].id;
            console.log('📊 CREATE_SCHEDULE: Updating existing schedule with ID:', scheduleId);
            result = await pool.query(
                `UPDATE schedule 
                 SET name = $1, release_date = $2, updated_at = NOW() 
                 WHERE id = $3 RETURNING *`,
                [scheduleData.name, scheduleData.release_date, scheduleId]
            );
            console.log('✅ CREATE_SCHEDULE: Schedule updated successfully');
        } else {
            // Create new schedule
            console.log('📊 CREATE_SCHEDULE: Creating new schedule');
            result = await pool.query(
                `INSERT INTO schedule (name, release_date, is_published, created_at, updated_at) 
                 VALUES ($1, $2, false, NOW(), NOW()) RETURNING *`,
                [scheduleData.name, scheduleData.release_date]
            );
            console.log('✅ CREATE_SCHEDULE: Schedule created successfully');
        }
        
        console.log('🆔 CREATE_SCHEDULE: Schedule ID:', result.rows[0].id);
        console.log('📋 CREATE_SCHEDULE: Schedule data:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ CREATE_SCHEDULE: Database error:', error);
        console.error('💥 CREATE_SCHEDULE: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create/update schedule' });
    }
};

// Update the single schedule info
exports.updateSchedule = async (req, res) => {
    console.log('✏️ UPDATE_SCHEDULE: Starting schedule update...');
    console.log('📋 UPDATE_SCHEDULE: Request body:', req.body);
    console.log('👤 UPDATE_SCHEDULE: User info:', req.user);
    
    try {
        const { name, release_date, is_published } = req.body;
        
        console.log('📝 UPDATE_SCHEDULE: Parsed data:', {
            name: name,
            release_date: release_date,
            is_published: is_published,
            nameLength: name ? name.length : 0
        });
        
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('❌ UPDATE_SCHEDULE: No schedule found');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('🆔 UPDATE_SCHEDULE: Updating schedule ID:', scheduleId);
        
        console.log('📊 UPDATE_SCHEDULE: Executing update query...');
        const result = await pool.query(
            `UPDATE schedule
             SET name = COALESCE($1, name), 
                 release_date = COALESCE($2, release_date), 
                 is_published = COALESCE($3, is_published),
                 updated_at = NOW()
             WHERE id = $4 RETURNING *`,
            [name, release_date, is_published, scheduleId]
        );
        
        console.log('✅ UPDATE_SCHEDULE: Schedule updated successfully');
        console.log('📋 UPDATE_SCHEDULE: Updated schedule data:', result.rows[0]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ UPDATE_SCHEDULE: Database error:', error);
        console.error('💥 UPDATE_SCHEDULE: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
};

// Reset the single schedule (clear all data but keep structure)
exports.deleteSchedule = async (req, res) => {
    console.log('🗑️ DELETE_SCHEDULE: Starting schedule reset...');
    console.log('👤 DELETE_SCHEDULE: User info:', req.user);
    
    try {
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('❌ DELETE_SCHEDULE: No schedule found to reset');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('🆔 DELETE_SCHEDULE: Resetting schedule ID:', scheduleId);
        console.log('⚠️ DELETE_SCHEDULE: This will delete all days and events');
        
        // Delete in order: events -> days, but keep the schedule
        console.log('📊 DELETE_SCHEDULE: Step 1 - Deleting events...');
        const eventsResult = await pool.query('DELETE FROM events WHERE day_id IN (SELECT id FROM days WHERE schedule_id = $1)', [scheduleId]);
        console.log('✅ DELETE_SCHEDULE: Deleted events count:', eventsResult.rowCount);
        
        console.log('📊 DELETE_SCHEDULE: Step 2 - Deleting days...');
        const daysResult = await pool.query('DELETE FROM days WHERE schedule_id = $1', [scheduleId]);
        console.log('✅ DELETE_SCHEDULE: Deleted days count:', daysResult.rowCount);
        
        console.log('📊 DELETE_SCHEDULE: Step 3 - Resetting schedule to defaults...');
        const result = await pool.query(
            `UPDATE schedule 
             SET name = 'Conference Schedule', 
                 is_published = false, 
                 release_date = NOW() + INTERVAL '1 day',
                 updated_at = NOW()
             WHERE id = $1 RETURNING *`, 
            [scheduleId]
        );
        
        console.log('✅ DELETE_SCHEDULE: Schedule reset successfully');
        console.log('📋 DELETE_SCHEDULE: Reset schedule data:', result.rows[0]);
        console.log('📊 DELETE_SCHEDULE: Total deletions - Events:', eventsResult.rowCount, 'Days:', daysResult.rowCount);
        
        res.json({ message: 'Schedule reset successfully', schedule: result.rows[0] });
    } catch (error) {
        console.error('❌ DELETE_SCHEDULE: Database error:', error);
        console.error('💥 DELETE_SCHEDULE: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to reset schedule' });
    }
};

// =============================================================================
// DAY MANAGEMENT (Step 2)
// =============================================================================

// Get days for the single schedule
exports.getDays = async (req, res) => {
    console.log('📅 GET_DAYS: Starting request for schedule days...');
    console.log('👤 GET_DAYS: User info:', req.user);
    
    try {
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('❌ GET_DAYS: No schedule found');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('🔍 GET_DAYS: Looking for days in schedule ID:', scheduleId);
        
        console.log('📊 GET_DAYS: Executing days query...');
        const result = await pool.query(
            `SELECT d.*, COUNT(e.id) as event_count
             FROM days d
             LEFT JOIN events e ON d.id = e.day_id
             WHERE d.schedule_id = $1
             GROUP BY d.id
             ORDER BY d.date`,
            [scheduleId]
        );
        
        console.log('✅ GET_DAYS: Query successful, rows returned:', result.rows.length);
        console.log('📋 GET_DAYS: Days data preview:', result.rows.map(d => ({
            id: d.id,
            date: d.date,
            label: d.label,
            event_count: d.event_count
        })));
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ GET_DAYS: Database error:', error);
        console.error('💥 GET_DAYS: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch days' });
    }
};

// Create new day for the single schedule
exports.createDay = async (req, res) => {
    console.log('📅 CREATE_DAY: Starting day creation...');
    console.log('📋 CREATE_DAY: Request body:', req.body);
    console.log('👤 CREATE_DAY: User info:', req.user);
    
    try {
        const { date, label } = req.body;
        
        console.log('📝 CREATE_DAY: Parsed data:', {
            date: date,
            label: label,
            labelLength: label ? label.length : 0
        });
        
        if (!date) {
            console.log('❌ CREATE_DAY: Validation failed - missing date');
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('❌ CREATE_DAY: No schedule found');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('🆔 CREATE_DAY: Using schedule ID:', scheduleId);
        
        console.log('📊 CREATE_DAY: Executing insert query...');
        const result = await pool.query(
            'INSERT INTO days (schedule_id, date, label, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [scheduleId, date, label]
        );
        
        console.log('✅ CREATE_DAY: Day created successfully');
        console.log('🆔 CREATE_DAY: New day ID:', result.rows[0].id);
        console.log('📋 CREATE_DAY: Created day data:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ CREATE_DAY: Database error:', error);
        console.error('💥 CREATE_DAY: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create day' });
    }
};

// Update day
exports.updateDay = async (req, res) => {
    console.log('✏️ UPDATE_DAY: Starting day update...');
    console.log('🆔 UPDATE_DAY: Request params:', req.params);
    console.log('📋 UPDATE_DAY: Request body:', req.body);
    console.log('👤 UPDATE_DAY: User info:', req.user);
    
    try {
        const { id } = req.params;
        const { date, label } = req.body;
        
        console.log('📝 UPDATE_DAY: Parsed data:', {
            dayId: id,
            date: date,
            label: label,
            labelLength: label ? label.length : 0
        });
        
        console.log('📊 UPDATE_DAY: Executing update query...');
        const result = await pool.query(
            'UPDATE days SET date = COALESCE($1, date), label = COALESCE($2, label) WHERE id = $3 RETURNING *',
            [date, label, id]
        );
        
        console.log('📋 UPDATE_DAY: Update query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('❌ UPDATE_DAY: Day not found for ID:', id);
            return res.status(404).json({ error: 'Day not found' });
        }
        
        console.log('✅ UPDATE_DAY: Day updated successfully');
        console.log('📋 UPDATE_DAY: Updated day data:', result.rows[0]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ UPDATE_DAY: Database error:', error);
        console.error('💥 UPDATE_DAY: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to update day' });
    }
};

// Delete day
exports.deleteDay = async (req, res) => {
    console.log('🗑️ DELETE_DAY: Starting day deletion...');
    console.log('🆔 DELETE_DAY: Request params:', req.params);
    console.log('👤 DELETE_DAY: User info:', req.user);
    
    try {
        const { id } = req.params;
        
        console.log('🔍 DELETE_DAY: Attempting to delete day ID:', id);
        console.log('⚠️ DELETE_DAY: This will cascade delete all events for this day');
        
        // Delete events first, then day
        console.log('📊 DELETE_DAY: Step 1 - Deleting events for day...');
        const eventsResult = await pool.query('DELETE FROM events WHERE day_id = $1', [id]);
        console.log('✅ DELETE_DAY: Deleted events count:', eventsResult.rowCount);
        
        console.log('📊 DELETE_DAY: Step 2 - Deleting day...');
        const result = await pool.query('DELETE FROM days WHERE id = $1 RETURNING *', [id]);
        console.log('📋 DELETE_DAY: Delete day query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('❌ DELETE_DAY: Day not found for ID:', id);
            return res.status(404).json({ error: 'Day not found' });
        }
        
        console.log('✅ DELETE_DAY: Day deleted successfully');
        console.log('📋 DELETE_DAY: Deleted day data:', result.rows[0]);
        console.log('📊 DELETE_DAY: Total deletions - Events:', eventsResult.rowCount, 'Days: 1');
        
        res.json({ message: 'Day deleted successfully' });
    } catch (error) {
        console.error('❌ DELETE_DAY: Database error:', error);
        console.error('💥 DELETE_DAY: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to delete day' });
    }
};

// =============================================================================
// EVENT MANAGEMENT (Step 3)
// =============================================================================

// Get events for a day
exports.getEvents = async (req, res) => {
    console.log('🎯 GET_EVENTS: Starting request for day events...');
    console.log('🆔 GET_EVENTS: Request params:', req.params);
    console.log('👤 GET_EVENTS: User info:', req.user);
    
    try {
        const { dayId } = req.params;
        
        console.log('🔍 GET_EVENTS: Looking for events in day ID:', dayId);
        
        console.log('📊 GET_EVENTS: Executing events query...');
        const result = await pool.query(
            'SELECT * FROM events WHERE day_id = $1 ORDER BY start_time',
            [dayId]
        );
        
        console.log('✅ GET_EVENTS: Query successful, rows returned:', result.rows.length);
        console.log('📋 GET_EVENTS: Events data preview:', result.rows.map(e => ({
            id: e.id,
            title: e.title,
            start_time: e.start_time,
            end_time: e.end_time,
            location: e.location
        })));
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ GET_EVENTS: Database error:', error);
        console.error('💥 GET_EVENTS: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Create new event
exports.createEvent = async (req, res) => {
    console.log('🎯 CREATE_EVENT: Starting event creation...');
    console.log('🆔 CREATE_EVENT: Request params:', req.params);
    console.log('📋 CREATE_EVENT: Request body:', req.body);
    console.log('👤 CREATE_EVENT: User info:', req.user);
    
    try {
        const { dayId } = req.params;
        const { title, start_time, end_time, location, description } = req.body;
        
        console.log('📝 CREATE_EVENT: Parsed data:', {
            dayId: dayId,
            title: title,
            start_time: start_time,
            end_time: end_time,
            location: location,
            description: description,
            titleLength: title ? title.length : 0,
            descriptionLength: description ? description.length : 0
        });
        
        if (!title || !start_time || !end_time) {
            console.log('❌ CREATE_EVENT: Validation failed - missing required fields');
            console.log('🚫 CREATE_EVENT: Missing fields:', {
                title: !title,
                start_time: !start_time,
                end_time: !end_time
            });
            return res.status(400).json({ error: 'Title, start time, and end time are required' });
        }
        
        // Validate time logic
        if (start_time >= end_time) {
            console.log('❌ CREATE_EVENT: Validation failed - invalid time range');
            console.log('⏰ CREATE_EVENT: Time comparison:', { start_time, end_time });
            return res.status(400).json({ error: 'End time must be after start time' });
        }
        
        console.log('📊 CREATE_EVENT: Executing insert query...');
        const result = await pool.query(
            `INSERT INTO events (day_id, title, start_time, end_time, location, description, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [dayId, title, start_time, end_time, location, description]
        );
        
        console.log('✅ CREATE_EVENT: Event created successfully');
        console.log('🆔 CREATE_EVENT: New event ID:', result.rows[0].id);
        console.log('📋 CREATE_EVENT: Created event data:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ CREATE_EVENT: Database error:', error);
        console.error('💥 CREATE_EVENT: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    console.log('✏️ UPDATE_EVENT: Starting event update...');
    console.log('🆔 UPDATE_EVENT: Request params:', req.params);
    console.log('📋 UPDATE_EVENT: Request body:', req.body);
    console.log('👤 UPDATE_EVENT: User info:', req.user);
    
    try {
        const { id } = req.params;
        const { title, start_time, end_time, location, description } = req.body;

        console.log('📝 UPDATE_EVENT: Parsed data:', {
            eventId: id,
            title: title,
            start_time: start_time,
            end_time: end_time,
            location: location,
            description: description,
            titleLength: title ? title.length : 0,
            descriptionLength: description ? description.length : 0
        });
        
        // Validate time logic if both times are provided
        if (start_time && end_time && start_time >= end_time) {
            console.log('❌ UPDATE_EVENT: Validation failed - invalid time range');
            console.log('⏰ UPDATE_EVENT: Time comparison:', { start_time, end_time });
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        console.log('📊 UPDATE_EVENT: Executing update query...');
        const result = await pool.query(
            `UPDATE events 
             SET title = COALESCE($1, title),
                 start_time = COALESCE($2, start_time),
                 end_time = COALESCE($3, end_time),
                 location = COALESCE($4, location),
                 description = COALESCE($5, description)
             WHERE id = $6 RETURNING *`,
            [title, start_time, end_time, location, description, id]
        );
        
        console.log('📋 UPDATE_EVENT: Update query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('❌ UPDATE_EVENT: Event not found for ID:', id);
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('✅ UPDATE_EVENT: Event updated successfully');
        console.log('📋 UPDATE_EVENT: Updated event data:', result.rows[0]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ UPDATE_EVENT: Database error:', error);
        console.error('💥 UPDATE_EVENT: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    console.log('🗑️ DELETE_EVENT: Starting event deletion...');
    console.log('🆔 DELETE_EVENT: Request params:', req.params);
    console.log('👤 DELETE_EVENT: User info:', req.user);
    
    try {
        const { id } = req.params;
        
        console.log('🔍 DELETE_EVENT: Attempting to delete event ID:', id);
        
        console.log('📊 DELETE_EVENT: Executing delete query...');
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
        
        console.log('📋 DELETE_EVENT: Delete query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('❌ DELETE_EVENT: Event not found for ID:', id);
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('✅ DELETE_EVENT: Event deleted successfully');
        console.log('📋 DELETE_EVENT: Deleted event data:', result.rows[0]);
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('❌ DELETE_EVENT: Database error:', error);
        console.error('💥 DELETE_EVENT: Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};