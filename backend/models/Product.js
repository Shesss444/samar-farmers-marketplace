import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  sellerName: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  category: { type: String },
  imageUrl: { type: String },
  imagePosition: { type: String },
  description: { type: String },
  kilograms: { type: Number },
  farmerBio: { type: String },
  farmingPractices: { type: [String], default: [] },
  municipality: { type: String },
  location: { type: Object },
  createdAt: { type: Date, default: () => new Date() }
});

ProductSchema.methods.toJSONSafe = function() {
  return {
    id: this._id.toString(),
    sellerId: this.sellerId,
    sellerName: this.sellerName,
    name: this.name,
    price: this.price,
    quantity: this.quantity,
    category: this.category,
    imageUrl: this.imageUrl,
    imagePosition: this.imagePosition,
    description: this.description,
    kilograms: this.kilograms,
    farmerBio: this.farmerBio,
    farmingPractices: this.farmingPractices,
    municipality: this.municipality,
    location: this.location,
    createdAt: this.createdAt
  };
};

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
