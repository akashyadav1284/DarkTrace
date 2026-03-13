const express = require('express');
const router = express.Router();
const ThreatEvent = require('../models/ThreatEvent');

// @route   GET /api/threat/logs
// @desc    Get threat logs
// @access  Public
router.get('/logs', async (req, res) => {
    try {
        const threats = await ThreatEvent.find().sort({ detectedAt: -1 }).limit(100);
        res.json(threats);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/threat/stats
// @desc    Get aggregation strings for dashboard charts
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const totalThreats = await ThreatEvent.countDocuments();

        const typeDistribution = await ThreatEvent.aggregate([
            { $group: { _id: '$attackType', count: { $sum: 1 } } }
        ]);

        const severityDistribution = await ThreatEvent.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        res.json({
            totalThreats,
            typeDistribution,
            severityDistribution
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
