const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
    sourceIP: { type: String, required: true },
    destinationPort: { type: Number, required: true },
    protocol: { type: String, required: true },
    packetSize: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    threatScore: { type: Number, default: 0 },
    classification: { type: String, enum: ['Normal', 'Suspicious', 'Malicious'], default: 'Normal' },
    lat: { type: Number },
    lng: { type: Number },
    country: { type: String }
});

// Create index for faster querying
trafficLogSchema.index({ timestamp: -1 });
trafficLogSchema.index({ classification: 1 });
trafficLogSchema.index({ sourceIP: 1 });

const TrafficLog = mongoose.model('TrafficLog', trafficLogSchema);
module.exports = TrafficLog;
