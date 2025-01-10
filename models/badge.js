const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    badge_icon: {
        type: String,
        required: true,
    },
    badge_points: { type: Number, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Badge', badgeSchema);
