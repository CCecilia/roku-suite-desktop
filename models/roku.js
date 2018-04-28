const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RokuSchema = new Schema({
    ip_address: {
        type: String,
        required: true
    },
    device_name: {
        type: String,
        required: true
    },
    usename: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Roku', RokuSchema);
