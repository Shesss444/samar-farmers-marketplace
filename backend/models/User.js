import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  role: { type: String, enum: ['buyer','farmer','admin'], default: 'buyer' },
  municipality: { type: String },
  phone: { type: String },
  primaryProducts: { type: [String], default: [] },
  bio: { type: String },
  farmingPractices: { type: [String], default: [] },
  location: { type: Object },
  isApproved: { type: Boolean },
  createdAt: { type: Date, default: () => new Date() }
});

UserSchema.methods.toProfile = function() {
  return {
    uid: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    municipality: this.municipality,
    phone: this.phone,
    primaryProducts: this.primaryProducts,
    bio: this.bio,
    farmingPractices: this.farmingPractices,
    location: this.location,
    isApproved: this.isApproved,
    createdAt: this.createdAt
  };
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
