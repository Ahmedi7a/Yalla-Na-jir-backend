const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const isAdmin = require('../middleware/is-admin.js');
const Approval = require('../models/approval.js');
const User = require('../models/user.js');

const router = express.Router();

// All routes are protected by verifyToken
router.use(verifyToken);

// User requests to become a dealer
router.post('/request-dealer', async (req, res) => {
  try {
    // Check if there is already a pending request for this user
    const existingRequest = await Approval.findOne({ userId: req.user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ error: 'Your request to become a dealer is already pending.' });
    }
    
    // Create a new dealer approval request
    const approval = await Approval.create({
      userId: req.user._id,
      status: 'pending',
    });
    
    res.status(201).json({ message: 'Dealer request submitted.', approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin approves or rejects a dealer request
router.put('/:approvalId/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const approval = await Approval.findById(req.params.approvalId);
    if (!approval) {
      return res.status(404).json({ message: 'Approval request not found.' });
    }

    approval.status = status;
    approval.adminId = req.user._id;
    approval.approvedAt = status === 'approved' ? new Date() : null;
    await approval.save();

    // If approved, update the user's role to 'dealer'
    if (status === 'approved') {
      await User.findByIdAndUpdate(approval.userId, { role: 'dealer' });
    }

   //when change to reject return him to user

    res.json({ message: `Dealer request ${status}.`, approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin gets all pending dealer requests
router.get('/pending-dealer-requests', isAdmin, async (req, res) => {
  try {
    const approvals = await Approval.find({ status: 'pending' }).populate('userId', 'username');
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin deletes an approval request
router.delete('/:approvalId', isAdmin, async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.approvalId);
    if (!approval) {
      return res.status(404).json({ message: 'Approval request not found.' });
    }
    await Approval.findByIdAndDelete(req.params.approvalId);
    res.status(200).json({ message: 'Approval request deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/downgrade-dealer/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'dealer') {
      return res.status(400).json({ message: 'User is not a dealer.' });
    }

    // Update the user's role to "user"
    user.role = 'user';
    await user.save();

    res.status(200).json({ message: 'User role downgraded to "user".', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;