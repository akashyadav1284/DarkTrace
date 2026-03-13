const mongoose = require('mongoose');

const blockedIPSchema = new mongoose.Schema({
    ipAddress: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    blockedAt: { type: Date, default: Date.now }
});

const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema);
module.exports = BlockedIP;
