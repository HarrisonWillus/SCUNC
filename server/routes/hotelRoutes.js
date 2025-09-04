const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const isAdmin = require('../middleware/isAdmin');
const sendUserThrough = require('../middleware/decodeJWT');
const uploadSinglePhoto = require('../middleware/uploadPhoto');

// =============================================================================
// HOTEL ROUTES
// =============================================================================

// Public: Get all hotels
router.get('/', hotelController.getAllHotels);

// Public: Get single hotel by ID
router.get('/:id', hotelController.getHotelById);

// Admin: Create new hotel
router.post('/', uploadSinglePhoto, sendUserThrough, isAdmin, hotelController.createHotel);

// Admin: Update hotel
router.put('/:id', uploadSinglePhoto, sendUserThrough, isAdmin, hotelController.updateHotel);

// Admin: Delete hotel
router.delete('/:id', sendUserThrough, isAdmin, hotelController.deleteHotel);

module.exports = router;
