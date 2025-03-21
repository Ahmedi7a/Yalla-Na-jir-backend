const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  // The user requesting to become a dealer
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // The admin who processed the request
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);