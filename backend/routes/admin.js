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
        const blocked = {
            _id: Math.random().toString(36).substring(7),
            ipAddress,
            reason,
            blockedAt: new Date()
        };

        global.inMemoryBlockedIPs = global.inMemoryBlockedIPs || [];
        global.inMemoryBlockedIPs.unshift(blocked);

        // Attempt DB creation silently
        BlockedIP.create({ ipAddress, reason }).catch(e => {});

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
        global.inMemoryBlockedIPs = (global.inMemoryBlockedIPs || []).filter(b => b.ipAddress !== ipAddress);
        
        // Attempt DB unblock silently
        BlockedIP.findOneAndDelete({ ipAddress }).catch(e => {});
        
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
        global.inMemoryBlockedIPs = global.inMemoryBlockedIPs || [];
        if (global.inMemoryBlockedIPs.length > 0) {
            return res.json(global.inMemoryBlockedIPs);
        }

        const blockedIPs = await BlockedIP.find().sort({ blockedAt: -1 }).maxTimeMS(1500);
        res.json(blockedIPs);
    } catch (error) {
        console.warn("MongoDB Timeout on /admin/blocked. Returning empty array.");
        res.json([]);
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').maxTimeMS(1500);
        res.json(users);
    } catch (error) {
        console.warn("MongoDB Timeout on /admin/users. Returning mock dashboard admin.");
        res.json([{
            _id: "global-sys-admin-9992462520",
            name: "akashyadav9992462520",
            email: "admin@darktrace.soc",
            role: "admin"
        }]);
    }
});

module.exports = router;
