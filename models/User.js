const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: String,
    x_data: String,
    created_at: Date
});

mongoose.model('User', userSchema);
