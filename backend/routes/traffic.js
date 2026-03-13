const express = require('express');
const router = express.Router();
const axios = require('axios');
let geoip;
try {
    geoip = require('geoip-lite');
} catch (e) {
    console.warn("geoip-lite module not found. Using mock GeoIP data.");
    geoip = null;
}
const TrafficLog = require('../models/TrafficLog');
const ThreatEvent = require('../models/ThreatEvent');
const BlockedIP = require('../models/BlockedIP');
const { exec } = require('child_process');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// @route   POST /api/traffic/send
// @desc    Receive incoming traffic packet, analyze via ML, log and broadcast
// @access  Public (In real system, this would be an internal network endpoint)
router.post('/send', async (req, res) => {
    const { sourceIP, destinationPort, protocol, packetSize } = req.body;

    try {
        // 1. Check if IP is blocked
        const isBlocked = await BlockedIP.findOne({ ipAddress: sourceIP });
        if (isBlocked) {
            return res.status(403).json({ message: 'Connection dropped. IP is blocked.' });
        }

        // 2. Send to ML service for anomaly detection
        let mlResponse;
        try {
            mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-threat`, {
                packetSize,
                destinationPort,
                protocol
            });
        } catch (mlError) {
            console.error('ML Service Error:', mlError.message);
            mlResponse = { data: { anomalyScore: 0, classification: `Normal (Error: ${mlError.message})`, threatLevel: 0 } };
        }

        const { anomalyScore, classification, threatLevel } = mlResponse.data;

        // GeoIP Lookup
        // Fallback to random coordinates if IP is local/private (for demo simulation purposes)
        const geo = geoip ? geoip.lookup(sourceIP) : null;
        const lat = geo ? geo.ll[0] : (Math.random() * 140 - 70);
        const lng = geo ? geo.ll[1] : (Math.random() * 360 - 180);
        const country = geo ? geo.country : 'Unknown';

        // 3. Save Traffic Log
        const newLog = await TrafficLog.create({
            sourceIP,
            destinationPort,
            protocol,
            packetSize,
            threatScore: anomalyScore,
            classification,
            lat,
            lng,
            country
        });

        // Broadcast to clients via Socket.io
        req.io.emit('new_traffic', newLog);

        // 4. If malicious, create Threat Event and Broadcast Alert
        if (classification === 'Malicious' || classification === 'Suspicious') {
            const severity = threatLevel > 80 ? 'Critical' : (threatLevel > 60 ? 'High' : (threatLevel > 30 ? 'Medium' : 'Low'));
            const attackType = classification === 'Malicious' ? 'Potential Attack (DDoS/Malware/Scan)' : 'Unusual Behavior';

            const threatEvent = await ThreatEvent.create({
                attackType,
                ipAddress: sourceIP,
                severity,
                actionTaken: severity === 'Critical' ? 'Blocked' : 'Alerted'
            });

            req.io.emit('new_alert', threatEvent);

            if (severity === 'Critical') {
                // Auto-block
                await BlockedIP.create({ ipAddress: sourceIP, reason: 'Auto-blocked due to critical threat score' });
                
                // OS-Level Firewall Block (Windows)
                const ruleName = `DarkTrace-SOC-Block-${sourceIP.replace(/\./g, '-')}`;
                const cmd = `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=block remoteip=${sourceIP}`;
                
                exec(cmd, (err) => {
                    if (err) {
                        console.log(`[OS Firewall] Threat logged: ${sourceIP} (Run Node as Admin to enforce physical block)`);
                    } else {
                        console.log(`[OS Firewall] System auto-blocked ${sourceIP} via netsh.`);
                    }
                });
            }
        }

        res.status(200).json({ message: 'Packet processed', data: newLog });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error parsing traffic' });
    }
});

// @route   GET /api/traffic/live
// @desc    Get recent traffic logs
// @access  Public
router.get('/live', async (req, res) => {
    try {
        const logs = await TrafficLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
