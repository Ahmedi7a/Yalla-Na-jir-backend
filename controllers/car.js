const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Car = require('../models/car.js');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

//get a car by id
router.get('/:carId', async (req, res) => {
    try {

const car = await Car.findById(req.params.carId).populate([
  'user',
  'reviews.user',
]);
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


//anything bellow this the user has to sign in
router.use(verifyToken);





module.exports = router;