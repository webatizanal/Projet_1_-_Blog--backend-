const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'approved' }
});

module.exports = mongoose.model('Comment', commentSchema);