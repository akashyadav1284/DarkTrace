const mongoose = require('mongoose');

const threatEventSchema = new mongoose.Schema({
    attackType: { type: String, required: true },
    ipAddress: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    actionTaken: { type: String, enum: ['Logged', 'Blocked', 'Alerted'], required: true },
    detectedAt: { type: Date, default: Date.now }
});

threatEventSchema.index({ detectedAt: -1 });

const ThreatEvent = mongoose.model('ThreatEvent', threatEventSchema);
module.exports = ThreatEvent;
