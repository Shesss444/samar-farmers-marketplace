import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  buyerId: { type: String, required: true },
  buyerName: { type: String },
  sellerId: { type: String, required: true },
  sellerName: { type: String },
  productId: { type: String, required: true },
  productName: { type: String },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['preparing', 'ready_to_pick_up', 'completed', 'pending', 'collected', 'delivered'], default: 'preparing' },
  deliveryDate: { type: String },
  createdAt: { type: Date, default: () => new Date() }
});

OrderSchema.methods.toJSONSafe = function() {
  const statusMap = { pending: 'preparing', collected: 'ready_to_pick_up', delivered: 'completed' };
  return {
    id: this._id.toString(),
    buyerId: this.buyerId,
    buyerName: this.buyerName,
    sellerId: this.sellerId,
    sellerName: this.sellerName,
    productId: this.productId,
    productName: this.productName,
    quantity: this.quantity,
    totalPrice: this.totalPrice,
    status: statusMap[this.status] || this.status,
    deliveryDate: this.deliveryDate,
    createdAt: this.createdAt
  };
};

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
