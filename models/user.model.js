const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: 'This field is required.'
  },
  name: {
    type: String,
    required: 'This field is required.'
  },
  surname: {
    type: String,
    required: 'This field is required.'
  },
  password: {
    type: String,
    required: 'This field is required.'
  }
})

mongoose.model('User', userSchema);
