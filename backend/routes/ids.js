const express = require('express');
const router = express.Router();
const IdsAlert = require('../models/IdsAlert');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/ids/live
// @desc    Get recent IDS alerts
// @access  Public
router.get('/live', async (req, res) => {
    try {
        const alerts = await IdsAlert.find().sort({ timestamp: -1 }).limit(100).maxTimeMS(1500);
        res.json(alerts);
    } catch (error) {
        console.warn("MongoDB Timeout on /ids/live endpoint. Returning empty array.");
        res.json([]);
    }
});

module.exports = router;
