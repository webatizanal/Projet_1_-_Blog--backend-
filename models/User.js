const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator').default;

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

userSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', userSchema);