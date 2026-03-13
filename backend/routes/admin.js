const express = require('express');
const router = express.Router();
const BlockedIP = require('../models/BlockedIP');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const { exec } = require('child_process');

// @route   POST /api/admin/block-ip
// @desc    Manually block an IP address
// @access  Private/Admin
router.post('/block-ip', protect, admin, async (req, res) => {
    const { ipAddress, reason } = req.body;

    try {
        const exists = await BlockedIP.findOne({ ipAddress });
        if (exists) {
            return res.status(400).json({ message: 'IP is already blocked' });
        }

        const blocked = await BlockedIP.create({ ipAddress, reason });

        const ruleName = `DarkTrace-SOC-Block-${ipAddress.replace(/\./g, '-')}`;
        const cmd = `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=block remoteip=${ipAddress}`;
        exec(cmd, (err) => {
            if (err) {
                console.log(`[OS Firewall] Block recorded in DB: ${ipAddress} (Elevate Node to Admin to affect Windows Firewall)`);
            } else {
                console.log(`[OS Firewall] Manually blocked ${ipAddress} via netsh.`);
            }
        });

        // Broadcast to clients dynamically
        req.io.emit('ip_blocked', blocked);

        res.status(201).json(blocked);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/admin/unblock-ip
// @desc    Manually unblock an IP address
// @access  Private/Admin
router.post('/unblock-ip', protect, admin, async (req, res) => {
    const { ipAddress } = req.body;

    try {
        await BlockedIP.findOneAndDelete({ ipAddress });
        
        const ruleName = `DarkTrace-SOC-Block-${ipAddress.replace(/\./g, '-')}`;
        const cmd = `netsh advfirewall firewall delete rule name="${ruleName}"`;
        exec(cmd, (err) => {
            if (err) {
                console.log(`[OS Firewall] Unblock recorded in DB: ${ipAddress} (Elevate Node to Admin to affect Windows Firewall)`);
            } else {
                console.log(`[OS Firewall] Unblocked ${ipAddress} via netsh.`);
            }
        });
        
        res.status(200).json({ message: `IP ${ipAddress} unblocked` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/blocked
// @desc    Get all blocked IPs
// @access  Private/Admin
router.get('/blocked', protect, async (req, res) => {
    try {
        const blockedIPs = await BlockedIP.find().sort({ blockedAt: -1 });
        res.json(blockedIPs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
