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

// In-Memory cache to preserve data across frontend tab-switches when disconnected from MongoDB
const inMemoryTraffic = [];
const MAX_MEMORY_LOGS = 100;

// @route   POST /api/traffic/send
// @desc    Receive incoming traffic packet, analyze via ML, log and broadcast
// @access  Public (In real system, this would be an internal network endpoint)
router.post('/send', async (req, res) => {
    const { sourceIP, destinationPort, protocol, packetSize } = req.body;

    try {
        // 1. Check if IP is blocked (wrapped in try-catch to prevent DB timeout from freezing websocket)
        try {
            const isBlocked = await BlockedIP.findOne({ ipAddress: sourceIP }).maxTimeMS(2000); // 2 second max timeout
            if (isBlocked) {
                return res.status(403).json({ message: 'Connection dropped. IP is blocked.' });
            }
        } catch (dbError) {
            console.warn("DB Timeout on BlockedIP check. Continuing to allow traffic...");
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
            // Render Free Tier can take 50 seconds to wake the Python ML cluster up.
            // If the ML connection fails, we immediately switch to a raw Node.js heuristic fallback!
            let fallbackClass = 'Normal';
            let fallbackThreat = 10;
            
            if (packetSize > 5000) { 
                fallbackClass = 'Malicious'; 
                fallbackThreat = 95; // DDoS
            } else if ([23, 25, 445, 3389].includes(destinationPort)) { 
                fallbackClass = 'Suspicious'; 
                fallbackThreat = 65; // Scan
            }
            
            mlResponse = { data: { anomalyScore: fallbackThreat, classification: fallbackClass, threatLevel: fallbackThreat } };
        }

        const { classification } = mlResponse.data;
        
        // Inject pseudo-random variance so scores bounce realistically instead of sitting exactly at 10, 65, and 95
        let threatLevel = 0;
        if (classification === 'Malicious') {
            threatLevel = Math.floor(Math.random() * 10) + 90; // 90 to 99
        } else if (classification === 'Suspicious') {
            threatLevel = Math.floor(Math.random() * 30) + 50; // 50 to 79
        } else {
            threatLevel = Math.floor(Math.random() * 20) + 5;  // 5 to 24
        }
        
        const anomalyScore = threatLevel; // synchronize score keys

        // GeoIP Lookup
        // Fallback to random coordinates if IP is local/private (for demo simulation purposes)
        const geo = geoip ? geoip.lookup(sourceIP) : null;
        const lat = geo ? geo.ll[0] : (Math.random() * 140 - 70);
        const lng = geo ? geo.ll[1] : (Math.random() * 360 - 180);
        const country = geo ? geo.country : 'Unknown';

        // 3. Prepare Traffic Log object
        const newLogPayload = {
            _id: Math.random().toString(36).substring(7), // Fake ID for immediate frontend rendering
            sourceIP,
            destinationPort,
            protocol,
            packetSize,
            threatScore: anomalyScore,
            classification,
            lat,
            lng,
            country,
            timestamp: new Date()
        };

        // Broadcast to clients via Socket.io IMMEDIATELY (Decouple from DB connection speed)
        req.io.emit('new_traffic', newLogPayload);

        // Store internally so if the user refreshes/changes tabs without MongoDB, it instantly repopulates
        inMemoryTraffic.unshift(newLogPayload);
        if (inMemoryTraffic.length > MAX_MEMORY_LOGS) {
            inMemoryTraffic.pop();
        }

        // Attempt to save Traffic Log to Database in background
        TrafficLog.create(newLogPayload).catch(e => console.error("Could not save packet to DB, but websocket broadcast succeeded."));

        // 4. If malicious, create Threat Event and Broadcast Alert
        if (classification === 'Malicious' || classification === 'Suspicious') {
            const severity = threatLevel > 80 ? 'Critical' : (threatLevel > 60 ? 'High' : (threatLevel > 30 ? 'Medium' : 'Low'));
            const attackType = classification === 'Malicious' ? 'Potential Attack (DDoS/Malware/Scan)' : 'Unusual Behavior';

            const threatEventPayload = {
                _id: Math.random().toString(36).substring(7),
                attackType,
                ipAddress: sourceIP,
                severity,
                actionTaken: severity === 'Critical' ? 'Blocked' : 'Alerted',
                timestamp: new Date()
            };

            // Broadcast IMMDIATELY
            req.io.emit('new_alert', threatEventPayload);

            // Save in background
            ThreatEvent.create(threatEventPayload).catch(e => console.error("Could not save threat to DB."));

            if (severity === 'Critical') {
                // Auto-block in background
                BlockedIP.create({ ipAddress: sourceIP, reason: 'Auto-blocked due to critical threat score' }).catch(e => {});
                
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

        res.status(200).json({ message: 'Packet processed', data: newLogPayload });

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
        if (inMemoryTraffic.length > 0) {
            // Serve instantly from RAM cache, bypassing DB
            return res.json(inMemoryTraffic);
        }
        const logs = await TrafficLog.find().sort({ timestamp: -1 }).limit(100).maxTimeMS(1500);
        res.json(logs);
    } catch (error) {
        console.warn("MongoDB Timeout on /live endpoint. Returning empty traffic array to preserve frontend stability.");
        res.json([]); // Fail safely to prevent frontend Axios errors
    }
});

module.exports = router;
