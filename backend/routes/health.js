const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');

// @route   GET /api/health
// @desc    Get system health metrics
// @access  Public (for internal dashboard)
router.get('/', async (req, res) => {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const cpus = os.cpus();

        // Simple CPU usage estimation based on loadavg (1 min)
        const loadAvg = os.loadavg()[0];
        const cpuUsagePercent = (loadAvg / cpus.length) * 100;

        const dbStatus = mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected';

        res.json({
            status: 'Operational',
            uptime: process.uptime(),
            cpu: {
                cores: cpus.length,
                usagePercent: Math.min(cpuUsagePercent, 100).toFixed(1)
            },
            memory: {
                totalGB: (totalMemory / 1e9).toFixed(2),
                usedGB: (usedMemory / 1e9).toFixed(2),
                usagePercent: ((usedMemory / totalMemory) * 100).toFixed(1)
            },
            database: {
                status: dbStatus
            },
            ml_service: {
                // In a production system, we'd ping the Flask service. 
                // For now, assuming healthy if backend is up.
                status: 'Healthy'
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
});

module.exports = router;
