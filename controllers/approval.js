const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const isAdmin = require('../middleware/is-admin.js');
const Approval = require('../models/approval.js');
const User = require('../models/user.js');
const Car = require('../models/car.js');
const Rental = require('../models/rental.js');
const router = express.Router();

router.use(verifyToken);

// ========== Dealer Request ==========
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

// ========== Admin Routes ==========

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

    if (status === 'approved') {
      await User.findByIdAndUpdate(approval.userId, { role: 'dealer' });
    }

    res.json({ message: `Dealer request ${status}.`, approval });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending-dealer-requests', isAdmin, async (req, res) => {
  try {
    const approvals = await Approval.find({ status: 'pending' })
      .populate({
        path: 'userId',
        select: 'username role',
        match: { role: { $ne: 'dealer' } },
      })
      .then(results => results.filter(a => a.userId));

    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    user.role = 'user';
    await user.save();

    const cars = await Car.find({ dealerId: user._id });
    const carIds = cars.map(car => car._id);

    await Rental.deleteMany({ carId: { $in: carIds } });
    await Car.deleteMany({ dealerId: user._id });
    await Approval.deleteMany({ userId: user._id });

    res.status(200).json({
      message: 'User role downgraded and associated dealer data removed.',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/approved-dealers', isAdmin, async (req, res) => {
  try {
    const dealers = await User.find({ role: 'dealer' }, 'username email');
    res.status(200).json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all-users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin User Management ==========
router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Car.deleteMany({ dealerId: user._id });
    await Rental.deleteMany({ userId: user._id });
    await Approval.deleteMany({ userId: user._id });

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:userId/role', isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'dealer', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin Rental Management ==========
router.put('/rentals/:rentalId/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid rental status' });
    }

    const rental = await Rental.findById(req.params.rentalId).populate('carId');
    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    rental.status = status;
    await rental.save();

    const car = await Car.findById(rental.carId._id);
    if (status === 'approved') car.availability = 'rented';
    else if (['rejected', 'completed', 'cancelled'].includes(status)) car.availability = 'available';
    await car.save();

    res.status(200).json({ message: `Rental status updated to ${status}`, rental });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/rentals/:rentalId', isAdmin, async (req, res) => {
  try {
    const rental = await Rental.findByIdAndDelete(req.params.rentalId);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    const car = await Car.findById(rental.carId);
    if (car) {
      car.availability = 'available';
      await car.save();
    }

    res.status(200).json({ message: 'Rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin fetch all rentals
router.get('/rentals/all-rentals', isAdmin, async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate({
        path: 'carId',
        select: 'brand model dealerId',
        populate: { path: 'dealerId', select: 'username' },
      })
      .populate('userId', 'username');

    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== Admin Car Management ==========
router.get('/cars', isAdmin, async (req, res) => {
  try {
    const cars = await Car.find().populate('dealerId', 'username');
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/cars/:carId', isAdmin, async (req, res) => {
  try {
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.carId,
      req.body,
      { new: true }
    );
    if (!updatedCar) return res.status(404).json({ message: 'Car not found' });

    res.status(200).json({ message: 'Car updated', updatedCar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cars/:carId', isAdmin, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    await Rental.deleteMany({ carId: car._id });

    res.status(200).json({ message: 'Car and associated rentals deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
