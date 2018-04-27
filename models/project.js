const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ProjectSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    root_path: {
        type: String,
        required: true
    },
    excluded_file_paths: {
        type: Array
    },
    git_branch: {
        type: String,
        default: 'Git Branch'
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
