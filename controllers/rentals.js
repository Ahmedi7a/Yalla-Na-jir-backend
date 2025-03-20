const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
// const Car = require('../models/rental.js');
const router = express.Router();

const Rentals = require('../models/rentals.js');
const Car = require('../models/car.js');

// ========== Public Routes ===========

// ========= Protected Routes =========

//anything bellow this the user has to sign in
router.use(verifyToken);

  // Create rental request (user-only)
   const createRental = async (req, res) => {

    try {
      const { carId, startDate, endDate } = req.body;

      const car = await Car.findById(carId);
      if (!car) return res.status(404).json({ message: 'Car not found.' });

      const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (totalDays <= 0) {
        return res.status(400).json({ message: 'Invalid rental period.' });
      }

      const totalPrice = totalDays * car.pricePerDay;

      const rental = await Rentals.create({
        userId: req.user._id,
        carId,
        startDate,
        endDate,
        totalPrice,
      });

      res.status(201).json({ message: 'Rental request created.', rental });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }


// Get user's rentals (user-only)
  const getUserRentals = async (req, res) => {
    try {
      const rentals = await Rentals.find({ userId: req.user._id }).populate(['carId', 'brand', 'model', 'year', 'location']);

      res.json(rentals);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

// Get rentals for dealer's cars (dealer-only)
const getDealerRentals = async (req, res) => {
    try {
      const dealerCars = await Car.find({ dealerId: req.user._id }).select('_id');
      const carIds = dealerCars.map(car => car._id);

      const rentals = await Rentals.find({ carId: { $in: carIds } })
        .populate('carId', 'brand model year location')
        .populate('userId', 'username');

      res.json(rentals);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Approve or reject rental (dealer-only)
   const updateRentalStatus = async (req, res) => {
    try {
      const { status } = req.body;
      if (!['approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid rental status.' });
      }

      const rental = await Rentals.findById(req.params.id).populate('carId');
      if (!rental || rental.carId.dealerId.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Rental not found or unauthorized.' });
      }

      rental.status = status;
      await rental.save();

      res.json({ message: `Rental ${status}.`, rental });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }




module.exports = router;