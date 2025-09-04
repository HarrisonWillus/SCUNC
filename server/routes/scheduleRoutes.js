const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const isAdmin = require('../middleware/isAdmin');
const sendUserThrough = require('../middleware/decodeJWT');

// =============================================================================
// SCHEDULE ROUTES (Single Schedule System)
// =============================================================================

// Public: Get the single schedule with days and events
router.get('/', sendUserThrough, scheduleController.getSchedule);
router.get('/details', sendUserThrough, scheduleController.getSchedule);

// Admin: Create or update the single schedule
router.post('/', isAdmin, scheduleController.createSchedule);

// Admin: Update the single schedule info (name, release_date, publish status)
router.put('/', isAdmin, scheduleController.updateSchedule);

// Admin: Reset the single schedule (clear all content but keep structure)
router.delete('/', isAdmin, scheduleController.deleteSchedule);

// =============================================================================
// DAY ROUTES (Single Schedule System)
// =============================================================================

// Admin: Get days for the single schedule
router.get('/days', isAdmin, scheduleController.getDays);

// Admin: Create new day for the single schedule
router.post('/days', isAdmin, scheduleController.createDay);

// Admin: Update day
router.put('/days/:id', isAdmin, scheduleController.updateDay);

// Admin: Delete day
router.delete('/days/:id', isAdmin, scheduleController.deleteDay);

// =============================================================================
// EVENT ROUTES (Single Schedule System)
// =============================================================================

// Admin: Get events for a day
router.get('/days/:dayId/events', isAdmin, scheduleController.getEvents);

// Admin: Create new event
router.post('/days/:dayId/events', isAdmin, scheduleController.createEvent);

// Admin: Update event
router.put('/events/:id', isAdmin, scheduleController.updateEvent);

// Admin: Delete event
router.delete('/events/:id', isAdmin, scheduleController.deleteEvent);

module.exports = router;