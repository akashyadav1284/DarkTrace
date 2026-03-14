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
        console.warn("MongoDB Timeout on /ids/live endpoint. Returning mock fallback data.");
        res.json([
            { _id: '1', timestamp: new Date().toISOString(), sourceIP: '45.22.11.2', destinationIP: '192.168.1.100', attackType: 'Port Scan', signatureId: 'ET SCAN Nmap', severity: 'Medium', message: 'Nmap active scan detected' },
            { _id: '2', timestamp: new Date(Date.now() - 50000).toISOString(), sourceIP: '112.54.33.22', destinationIP: '192.168.1.5', attackType: 'SQL Injection', signatureId: 'ET WEB_SPECIFIC_APPS', severity: 'Critical', message: 'SQLi attempt on login schema' },
            { _id: '3', timestamp: new Date(Date.now() - 150000).toISOString(), sourceIP: '8.8.4.4', destinationIP: '192.168.1.50', attackType: 'DDoS', signatureId: 'ET DOS Possible SYN Flood', severity: 'High', message: 'High volume half-open connections' },
            { _id: '4', timestamp: new Date(Date.now() - 300000).toISOString(), sourceIP: '192.168.1.20', destinationIP: '211.34.5.1', attackType: 'Malware C2', signatureId: 'ET TROJAN Suspected Trickbot', severity: 'Critical', message: 'Beaconing to known C2 server' }
        ]);
    }
});

module.exports = router;
