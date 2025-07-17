const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Region', regionSchema); 