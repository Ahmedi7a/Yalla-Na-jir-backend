const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Car = require('../models/car.js');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

//get a car by id

//anything bellow this the user has to sign in
router.use(verifyToken);

router.post('/', async (req, res) => {
    try {
        req.body.author = req.user._id;
        const car = await Car.create(req.body);
        car._doc.author = req.user;
        res.status(201).json(car);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const cars = await Car.find({})
            .populate('author')
            .sort({ createdAt: 'desc' });
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json(error);
    }
});


router.delete('/:carId', async (req, res) => {
    try {
        const car = await Car.findById(req.params.carId);

        if (!car.author.equals(req.user._id)) {
            return res.status(403).send("You're not allowed to do that!");
        }

        const deletedcar = await Car.findByIdAndDelete(req.params.carId);
        res.status(200).json(deletedcar);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/:carId', async (req, res) => {
    try {

const car = await Car.findById(req.params.carId)
      res.status(200).json(car);
    } catch (error) {
      res.status(500).json(error);
    }
  });

  //edit car by id
router.put('/:carId', async (req, res) => {
    try {
      const updatedCar = await Car.findByIdAndUpdate(req.params.carId, req.body, {
        new: true,
      });
      res.status(200).json(updatedCar);
    } catch (error) {
      res.status(500).json(error);
    }
  });

  //add review to car
router.post('/:carId/reviews', async (req, res) => {
  try {
      const { rating, comment, userId } = req.body;
      const carId = req.params.carId;

      const car = await Car.findById(carId);
      if (!car) {
          return res.status(404).json({ message: 'Car not found' });
      }

      const review = {
          userId: userId,  // Convert userId to ObjectId
          carId: carId, 
          rating,
          comment
      };

      car.reviews.push(review);
      await car.save();

      res.status(201).json(car);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});  //delete review
router.delete('/:carId/reviews/:reviewId', async (req, res) => {
  try {
      const car = await Car.findById(req.params.carId);
      car.reviews.remove({ _id: req.params.reviewId});
      await car.save();
      res.status(200).json({ message: 'Ok' });
  } catch (err) {
      res.status(500).json(err);
  }
});



module.exports = router;