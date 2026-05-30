const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['editor', 'moderator', 'contributor'],
        default: 'contributor'
    },
    bio: { type: String, maxlength: 500 },
    socialLinks: {
        twitter: { type: String },
        github: { type: String },
        linkedin: { type: String }
    },
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', staffSchema);