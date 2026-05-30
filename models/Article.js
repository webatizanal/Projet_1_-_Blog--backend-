const mongoose = require('mongoose');

const articlesSchema = mongoose.Schema({
    authorAvatar: { type: String, required: false },
    author: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: false, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    tags: { type: Array, required: false },
    publishedAt: { type: Date, required: true },
    readingTime: { type: Number },
    views: { type: Number },
    likes: { type: Number },
    featuredImage: { type: String, required: true },
    status: {
        type: String,
        enum: ['published', 'draft', 'disabled'],
        default: 'draft'
    }
});

module.exports = mongoose.model('Article', articlesSchema);