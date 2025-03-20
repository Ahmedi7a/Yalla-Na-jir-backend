const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String, 
    enum: ['admin', 'dealer', 'user'], 
    required: true },
});

userSchema.set('toJSON', {
  transform: (doc, obj) => {
    delete obj.hashedPassword;
  },
});

module.exports = model('User', userSchema);
