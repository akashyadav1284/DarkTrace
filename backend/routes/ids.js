const express = require('express');
const router = express.Router();
const IdsAlert = require('../models/IdsAlert');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/ids/live
// @desc    Get recent IDS alerts
// @access  Public
router.get('/live', async (req, res) => {
    try {
        const alerts = await IdsAlert.find().sort({ timestamp: -1 }).limit(100);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
