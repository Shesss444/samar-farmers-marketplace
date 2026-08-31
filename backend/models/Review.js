import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  sellerId: { type: String, required: true },
  productId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: () => new Date() }
});

ReviewSchema.methods.toJSONSafe = function() {
  return {
    id: this._id.toString(),
    orderId: this.orderId,
    buyerId: this.buyerId,
    buyerName: this.buyerName,
    sellerId: this.sellerId,
    productId: this.productId,
    rating: this.rating,
    comment: this.comment,
    createdAt: this.createdAt
  };
};

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);