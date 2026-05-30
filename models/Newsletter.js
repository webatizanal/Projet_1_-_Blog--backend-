const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribeAt: { type: Date, default: null },
    ipAddress: { type: String }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);