const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const isAdmin = require('../middleware/is-admin.js');
const Approval = require('../models/approval.js');
const User = require('../models/user.js');
const Car = require('../models/car.js');
const Rental = require('../models/rental.js');
const router = express.Router();

router.use(verifyToken);

// User requests to become a dealer
// User requests to become a dealer
router.post('/request-dealer', async (req, res) => {
  try {
    const { phone, description } = req.body;

    const user = await User.findById(req.user._id);
    if (user.role === 'dealer') {
      return res.status(400).json({ error: 'You are already a dealer.' });
    }

    const existingRequest = await Approval.findOne({
      userId: req.user._id,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'Your request is already pending.' });
    }

    const approval = await Approval.create({
      userId: req.user._id,
      phone,
      description,
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

    res.json({ message: `Dealer request ${status}.`, approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin gets all pending dealer requests, excluding users who are already dealers
router.get('/pending-dealer-requests', isAdmin, async (req, res) => {
  try {
    const approvals = await Approval.find({ status: 'pending' })
      .populate({
        path: 'userId',
        select: 'username role',
        match: { role: { $ne: 'dealer' } } // Exclude users already dealers
      })
      .then(results => results.filter(a => a.userId)); // Remove any null populated users

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

// Downgrade dealer to regular user
router.put('/downgrade-dealer/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role !== 'dealer') {
      return res.status(400).json({ message: 'User is not a dealer.' });
    }

    // Update the user's role
    user.role = 'user';
    await user.save();

    // Find all cars owned by the dealer
    const cars = await Car.find({ dealerId: user._id });
    const carIds = cars.map(car => car._id);

    // Delete all rentals associated with these cars
    await Rental.deleteMany({ carId: { $in: carIds } });

    // Delete the cars themselves
    await Car.deleteMany({ dealerId: user._id });

    // Also remove any pending approval requests for this user (just in case)
    await Approval.deleteMany({ userId: user._id });

    res.status(200).json({
      message: 'User role downgraded and associated dealer data removed.',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all approved dealers (admin only)
router.get('/approved-dealers', isAdmin, async (req, res) => {
  try {
    const dealers = await User.find({ role: 'dealer' }, 'username email');
    res.status(200).json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/all-users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
