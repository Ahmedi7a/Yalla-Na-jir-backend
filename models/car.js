const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  }, { timestamps: true });

const rentalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
  }, { timestamps: true });

const carSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  location: { type: String, required: true },
  availability: { type: String, enum: ['available', 'rented', 'unavailable'], default: 'available' },
  // approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  images: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviews: [reviewSchema],
  rentals: [rentalSchema],
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
module.exports = Car;