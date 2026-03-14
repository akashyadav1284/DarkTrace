const express = require('express');
const router = express.Router();
const ThreatEvent = require('../models/ThreatEvent');

// @route   GET /api/threat/logs
// @desc    Get threat logs
// @access  Public
router.get('/logs', async (req, res) => {
    try {
        global.inMemoryThreats = global.inMemoryThreats || [];
        if (global.inMemoryThreats.length > 0) {
            return res.json(global.inMemoryThreats.slice(0, 100));
        }

        const threats = await ThreatEvent.find().sort({ detectedAt: -1 }).limit(100).maxTimeMS(1500);
        res.json(threats);
    } catch (error) {
        console.warn("MongoDB Timeout on /threat/logs. Returning empty array.");
        res.json([]);
    }
});

// @route   GET /api/threat/stats
// @desc    Get aggregation strings for dashboard charts
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        global.inMemoryThreats = global.inMemoryThreats || [];
        
        // Fast Ram-Cache fallback for Dashboard widgets
        if (global.inMemoryThreats.length > 0) {
            const totalThreats = global.inMemoryThreats.length;
            
            // Build Type Distribution
            const typeMap = {};
            global.inMemoryThreats.forEach(t => {
                typeMap[t.attackType] = (typeMap[t.attackType] || 0) + 1;
            });
            const typeDistribution = Object.keys(typeMap).map(k => ({ _id: k, count: typeMap[k] }));

            // Build Severity Distribution
            const severityMap = {};
            global.inMemoryThreats.forEach(t => {
                severityMap[t.severity] = (severityMap[t.severity] || 0) + 1;
            });
            const severityDistribution = Object.keys(severityMap).map(k => ({ _id: k, count: severityMap[k] }));

            return res.json({ totalThreats, typeDistribution, severityDistribution });
        }

        const totalThreats = await ThreatEvent.countDocuments().maxTimeMS(1500);

        const typeDistribution = await ThreatEvent.aggregate([
            { $group: { _id: '$attackType', count: { $sum: 1 } } }
        ]).maxTimeMS(1500);

        const severityDistribution = await ThreatEvent.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]).maxTimeMS(1500);

        res.json({
            totalThreats,
            typeDistribution,
            severityDistribution
        });
    } catch (error) {
        console.warn("MongoDB Timeout on /threat/stats.");
        res.json({ totalThreats: 0, typeDistribution: [], severityDistribution: [] });
    }
});

module.exports = router;
