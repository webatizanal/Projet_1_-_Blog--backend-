const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator').default;

const categorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true }
});

categorySchema.plugin(uniqueValidator);
module.exports = mongoose.model('Category', categorySchema);