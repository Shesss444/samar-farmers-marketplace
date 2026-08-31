import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  buyerId: { type: String, required: true, index: true },
  buyerName: { type: String, required: true },
  sellerId: { type: String, required: true, index: true },
  sellerName: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['buyer', 'farmer'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: () => new Date() }
});

MessageSchema.methods.toJSONSafe = function() {
  return {
    id: this._id.toString(),
    productId: this.productId,
    productName: this.productName,
    buyerId: this.buyerId,
    buyerName: this.buyerName,
    sellerId: this.sellerId,
    sellerName: this.sellerName,
    senderId: this.senderId,
    senderRole: this.senderRole,
    message: this.message,
    createdAt: this.createdAt
  };
};

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);