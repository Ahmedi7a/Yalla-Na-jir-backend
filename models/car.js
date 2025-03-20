const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  }, { timestamps: true });

// const rentalSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
//     startDate: { type: Date, required: true },
//     endDate: { type: Date, required: true },
//     totalPrice: { type: Number },
//     status: {
//       type: String,
//       enum: ['pending', 'approved', 'rejected', 'completed'],
//       default: 'pending',
//     },
//   }, { timestamps: true });

const carSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  brand: { type: String  },
  model: { type: String },
  year: { type: Number },
  pricePerDay: { type: Number },
  location: { type: String },
  availability: { type: String, enum: ['available', 'rented', 'unavailable'], default: 'available' },
  // approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  images: { type: String },
  rentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rental' }],
  reviews: [reviewSchema],
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
module.exports = Car;