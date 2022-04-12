const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: 'This field is required.'
  },
  publishedAt: {
    type: String,
    required: 'This field is required.'
  },
  description: {
    type: String,
    required: 'This field is required.'
  },
  authorId: {
    type: String,
    required: 'This field is required.'
  },
  authorName: {
    type: String,
    required: 'This field is required.'
  }
});

mongoose.model('Article', newsSchema);
