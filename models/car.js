const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'  },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  }, { timestamps: true });

const carSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  brand: { type: String  },
  model: { type: String },
  year: { type: Number },
  pricePerDay: { type: Number },
  location: { type: String },
  availability: { type: String, enum: ['available', 'rented', 'unavailable'], default: 'available' },
  image: {
    url: { type: String, required: true }, // Cloudinary URL
    cloudinary_id: { type: String, required: true }, // Public ID for deletion
  },
  rentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rental' }],
  reviews: [reviewSchema],
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
module.exports = Car;