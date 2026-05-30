const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    website: { type: String, required: true },
    logoUrl: { type: String },
    description: { type: String, maxlength: 300 },
    type: {
        type: String,
        enum: ['sponsor', 'affiliate', 'friend', 'media'],
        default: 'friend'
    },
    contactEmail: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partnership', partnershipSchema);