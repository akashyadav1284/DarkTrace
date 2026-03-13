const mongoose = require('mongoose');

const idsAlertSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    sourceIP: { type: String, required: true },
    destinationIP: { type: String, required: true },
    attackType: { type: String, required: true },
    signatureId: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    message: { type: String, required: true }
});

const IdsAlert = mongoose.model('IdsAlert', idsAlertSchema);
module.exports = IdsAlert;
