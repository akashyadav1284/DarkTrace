const express = require('express');
const router = express.Router();

// Mock IP Reputation Database
const mockDBSignatures = {
    '192.168': { score: 0, label: 'Clean', tags: ['Local Network'] },
    '10.0': { score: 0, label: 'Clean', tags: ['Local Network'] },
    '45.144': { score: 98, label: 'Malicious', tags: ['Botnet', 'SSH Brute Force'] },
    '185.33': { score: 85, label: 'Suspicious', tags: ['Scanner', 'Proxy'] },
};

// @route   GET /api/intelligence/lookup/:ip
// @desc    Get threat intelligence for an IP address
// @access  Public (for demo purposes)
router.get('/lookup/:ip', (req, res) => {
    const { ip } = req.params;

    // Simulate API delay
    setTimeout(() => {
        let result = {
            ip,
            score: Math.floor(Math.random() * 20), // Default low risk
            label: 'Clean',
            tags: [],
            lastSeen: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
            country: 'Unknown'
        };

        // Check mock signatures
        for (const [prefix, data] of Object.entries(mockDBSignatures)) {
            if (ip.startsWith(prefix)) {
                result = { ...result, ...data };
                break;
            }
        }

        // Randomly assign some as malicious for demo if not matched
        if (result.label === 'Clean' && Math.random() > 0.8) {
            result.score = Math.floor(Math.random() * 40) + 50;
            result.label = result.score > 80 ? 'Malicious' : 'Suspicious';
            result.tags = ['Spam IP', 'Anonymizer'];
        }

        res.json(result);
    }, 600); // 600ms artificial delay
});

module.exports = router;
