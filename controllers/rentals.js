const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const isDealer = require('../middleware/is-dealer.js');
const isAdmin = require('../middleware/is-admin.js');
const { isValidObjectId } = require('mongoose');

const router = express.Router();

const Rentals = require('../models/rental.js');
const Car = require('../models/car.js');

// ========== Protected Routes =========
router.use(verifyToken);

// Create rental request (User only)
router.post('/:carId', async (req, res) => {
    try {
        const { carId } = req.params;

        // Validate carId
        if (!isValidObjectId(carId)) {
            return res.status(400).json({ error: "Invalid car ID" });
        }

        // Find the car
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ error: "Car not found" });
        }

        // Check car availability
        if (car.availability !== 'available') {
            return res.status(400).json({ error: "Car is not available" });
        }

        // Validate rental dates
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        if (isNaN(startDate) || isNaN(endDate) || startDate >= endDate) {
            return res.status(400).json({ error: "Invalid rental dates." });
        }

        // Calculate total price
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.pricePerDay;

        // Create the rental
        const rental = await Rentals.create({
            userId: req.user._id,
            carId,
            startDate,
            endDate,
            totalPrice,
            status: 'pending'
        });

        // Update car availability and rentals list
        car.availability = 'unavailable';
        car.rentals.push(rental._id);
        await car.save();

        res.status(201).json(rental);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's rentals (User only)
router.get('/my-rentals', async (req, res) => {
    try {
        const rentals = await Rentals.find({ userId: req.user._id })
            .populate('carId', 'brand model year location');
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get rentals for dealer's cars (Dealer only)
router.get('/dealer-rentals', isDealer, async (req, res) => {
    try {
        const dealerCars = await Car.find({ dealerId: req.user._id }).select('_id');
        if (!dealerCars.length) {
            return res.status(404).json({ message: 'No cars found for this dealer.' });
        }

        const carIds = dealerCars.map(car => car._id);

        const rentals = await Rentals.find({ carId: { $in: carIds } })
            .populate('carId', 'brand model year location')
            .populate('userId', 'username');

        res.json(rentals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve, reject, or complete a rental (Dealer only)
router.put('/:rentalId/status', isDealer, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid rental status.' });
        }

        const rental = await Rentals.findById(req.params.rentalId).populate('carId');
        if (!rental || rental.carId.dealerId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Rental not found or unauthorized.' });
        }

        rental.status = status;
        await rental.save();

        if (status === 'completed') {
            const car = await Car.findById(rental.carId._id);
            car.availability = 'available';
            await car.save();
        }

        res.json({ message: `Rental ${status}.`, rental });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// dealer can delete a rental (dealer only)
router.delete('/:rentalId', isDealer, async (req, res) => {
    try {
        const rental = await Rentals.findById(req.params.rentalId);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found.' });
        }

        await Rentals.findByIdAndDelete(req.params.rentalId);
        res.status(200).json({ message: 'Rental deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;