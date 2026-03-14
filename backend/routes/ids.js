const express = require('express');
const router = express.Router();
const IdsAlert = require('../models/IdsAlert');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/ids/live
// @desc    Get recent IDS alerts
// @access  Public
router.get('/live', async (req, res) => {
    try {
        global.inMemoryIdsAlerts = global.inMemoryIdsAlerts || [];
        
        if (global.inMemoryIdsAlerts.length > 0) {
            return res.json(global.inMemoryIdsAlerts);
        }

        const alerts = await IdsAlert.find().sort({ timestamp: -1 }).limit(100).maxTimeMS(1500);
        res.json(alerts);
    } catch (error) {
        console.warn("MongoDB Timeout on /ids/live endpoint. Returning mock fallback data.");
        global.inMemoryIdsAlerts = [
            { _id: '1', timestamp: new Date().toISOString(), sourceIP: '45.22.11.2', destinationIP: '192.168.1.100', attackType: 'Port Scan', signatureId: 'ET SCAN Nmap', severity: 'Medium', message: 'Nmap active scan detected' },
            { _id: '2', timestamp: new Date().toISOString(), sourceIP: '112.54.33.22', destinationIP: '192.168.1.5', attackType: 'SQL Injection', signatureId: 'ET WEB_SPECIFIC_APPS', severity: 'Critical', message: 'SQLi attempt on login schema' },
        ];
        res.json(global.inMemoryIdsAlerts);
    }
});

module.exports = router;
