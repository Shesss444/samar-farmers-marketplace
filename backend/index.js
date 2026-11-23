import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';
import Message from './models/Message.js';
import { sendSms } from './sms.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me-please';
const ORDER_STATUS_MAP = { pending: 'preparing', collected: 'ready_to_pick_up', delivered: 'completed' };

function normalizeOrderStatus(status) {
  return ORDER_STATUS_MAP[status] || status;
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set. Set it in backend/.env');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true }));
// Accept larger payloads (images as base64) — configurable via BACKEND_BODY_LIMIT env (default 10mb)
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// JWT auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Authorization token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (e) {
    console.error('Auth verify error:', e);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { autoIndex: true }).then(() => {
  console.log('Connected to MongoDB');
  try {
    console.log('MongoDB database:', mongoose.connection?.db?.databaseName || '(unknown)');
    console.log('MongoDB host(s):', mongoose.connection?.host || mongoose.connection?.client?.topology?.s?.seedlist || '(unknown)');
  } catch (e) {
    console.log('MongoDB connection info unavailable', e);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sign up route
app.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName, role = 'buyer', municipality, phone, photoURL, primaryProducts } = req.body;
    if (!email || !password || !displayName || !phone) return res.status(400).json({ error: 'Name, email, password, and contact number are required' });
    if (!['buyer', 'farmer'].includes(role)) return res.status(400).json({ error: 'Invalid account role' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email }).exec();
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const userDoc = new User({
      email,
      passwordHash: hash,
      displayName,
      role,
      municipality: municipality || undefined,
      phone: phone.trim(),
      photoURL: photoURL || undefined,
      primaryProducts: Array.isArray(primaryProducts) ? primaryProducts : (primaryProducts ? [primaryProducts] : []),
      // For farmers, leave isApproved undefined (pending). Buyers are approved immediately.
      ...(role === 'buyer' ? { isApproved: true } : {})
    });

    await userDoc.save();

    const profile = userDoc.toProfile();
    console.log('Signup created user:', { uid: profile.uid, email: profile.email, role: profile.role, isApproved: profile.isApproved });
    return res.status(201).json({ uid: profile.uid, profile });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Request a password reset. In production, deliver resetToken through an email provider.
app.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const response = { message: 'If an account exists for that email, a reset link has been requested.' };
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email }).exec();
    if (!user) return res.json(response);

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      return res.json({ ...response, resetToken });
    }
    return res.json(response);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Unable to request password reset' });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Reset token and new password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    }).exec();
    if (!user) return res.status(400).json({ error: 'Reset token is invalid or expired' });

    user.passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
});

  // Products routes
  // List products (optional filters)
  app.get('/products', async (req, res) => {
    try {
      const q = {};
      if (req.query.sellerId) q.sellerId = req.query.sellerId;
      if (req.query.category) q.category = req.query.category;
      if (req.query.municipality) q.municipality = req.query.municipality;
      const products = await Product.find(q).sort({ createdAt: -1 }).lean().exec();
      return res.json({ products: products.map(p => ({ ...p, id: p._id })) });
    } catch (e) {
      console.error('List products error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

  // Create product (farmer or admin)
  app.post('/products', authMiddleware, async (req, res) => {
    try {
      if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
      if (req.auth.role !== 'farmer' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Only farmers or admins can list products' });
      const body = req.body || {};
      const product = new Product({
        sellerId: req.auth.uid,
        sellerName: body.sellerName || body.sellerName || '',
        name: body.name,
        price: body.price,
        quantity: body.quantity,
        category: body.category,
        imageUrl: body.imageUrl,
        imagePosition: body.imagePosition,
        description: body.description,
        kilograms: body.kilograms,
        farmerBio: body.farmerBio,
        farmingPractices: body.farmingPractices,
        municipality: body.municipality,
        location: body.location
      });
      await product.save();
      return res.status(201).json({ product: product.toJSONSafe() });
    } catch (e) {
      console.error('Create product error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

  // Update product
  app.put('/products/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(id).exec();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (req.auth.role !== 'admin' && req.auth.uid !== product.sellerId) return res.status(403).json({ error: 'Not allowed' });
      const allowed = ['name','price','quantity','category','imageUrl','imagePosition','description','kilograms','farmerBio','farmingPractices','municipality','location'];
      const payload = {};
      for (const k of Object.keys(req.body || {})) if (allowed.includes(k)) payload[k] = req.body[k];
      const updated = await Product.findByIdAndUpdate(id, payload, { new: true }).exec();
      return res.json({ product: updated.toJSONSafe() });
    } catch (e) {
      console.error('Update product error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

  // Delete product
  app.delete('/products/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(id).exec();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (req.auth.role !== 'admin' && req.auth.uid !== product.sellerId) return res.status(403).json({ error: 'Not allowed' });
      await Product.findByIdAndDelete(id).exec();
      return res.json({ ok: true });
    } catch (e) {
      console.error('Delete product error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

  // Orders
  // Create orders (accepts array of orders)
  app.post('/orders', authMiddleware, async (req, res) => {
    try {
      if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
      if (req.auth.role !== 'buyer' && req.auth.role !== 'admin') return res.status(403).json({ error: 'Only buyers can place orders' });
      const orders = Array.isArray(req.body) ? req.body : [req.body];
      const results = [];
      for (const o of orders) {
        const product = await Product.findById(o.productId).exec();
        if (!product) {
          results.push({ ok: false, error: 'Product not found', productId: o.productId });
          continue;
        }
        const qty = Number(o.quantity || 1);
        // try to decrement atomically
        const updated = await Product.findOneAndUpdate({ _id: product._id, quantity: { $gte: qty } }, { $inc: { quantity: -qty } }, { new: true }).exec();
        if (!updated) {
          results.push({ ok: false, error: 'Insufficient stock', productId: o.productId });
          continue;
        }
        const buyer = await User.findById(req.auth.uid).exec();
        const orderDoc = new Order({
          buyerId: req.auth.uid,
          buyerName: buyer?.displayName || buyer?.email || 'Buyer',
          sellerId: product.sellerId,
          sellerName: product.sellerName || '',
          productId: product._id.toString(),
          productName: product.name,
          quantity: qty,
          totalPrice: product.price * qty,
          status: 'preparing',
          deliveryDate: o.deliveryDate
        });
        await orderDoc.save();
        results.push({ ok: true, order: orderDoc.toJSONSafe(), remaining: updated.quantity });
      }
      return res.status(201).json({ results });
    } catch (e) {
      console.error('Create orders error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

  // List orders (filter by buyerId or sellerId)
  app.get('/orders', authMiddleware, async (req, res) => {
    try {
      const q = {};
      if (req.query.buyerId) q.buyerId = req.query.buyerId;
      if (req.query.sellerId) q.sellerId = req.query.sellerId;
      // only allow non-admins to query their own orders
      if (req.auth.role !== 'admin') {
        if (req.query.buyerId && req.query.buyerId !== req.auth.uid) return res.status(403).json({ error: 'Forbidden' });
        if (req.query.sellerId && req.query.sellerId !== req.auth.uid) return res.status(403).json({ error: 'Forbidden' });
        // if no filter provided, default to buyer's orders if buyer, seller's orders if farmer
        if (!req.query.buyerId && !req.query.sellerId) {
          if (req.auth.role === 'buyer') q.buyerId = req.auth.uid;
          if (req.auth.role === 'farmer') q.sellerId = req.auth.uid;
        }
      }
      const docs = await Order.find(q).sort({ createdAt: -1 }).lean().exec();
      return res.json({ orders: docs.map(d => ({ ...d, id: d._id, status: normalizeOrderStatus(d.status) })) });
    } catch (e) {
      console.error('List orders error:', e);
      return res.status(500).json({ error: String(e) });
    }
  });

// Sign in route
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ uid: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const profile = user.toProfile();
    return res.json({ uid: profile.uid, idToken: token, profile });
  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Update order status
app.patch('/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    const { status } = req.body || {};
    const statusMap = { pending: 'preparing', collected: 'ready_to_pick_up', delivered: 'completed' };
    const normalizedStatus = statusMap[status] || status;
    if (!['preparing', 'ready_to_pick_up', 'completed'].includes(normalizedStatus)) return res.status(400).json({ error: 'Invalid status' });

    const order = await Order.findById(id).exec();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Role checks
    const isAdmin = req.auth.role === 'admin';
    const isBuyer = req.auth.uid === order.buyerId;
    const isSeller = req.auth.uid === order.sellerId;

    // Only the seller (farmer) or admin may change order status to collected/delivered
    if (normalizedStatus === 'ready_to_pick_up' || normalizedStatus === 'completed') {
      if (!isSeller && !isAdmin) return res.status(403).json({ error: 'Only seller (farmer) or admin can change status to collected/delivered' });
    }

    // Apply update
    const previousStatus = normalizeOrderStatus(order.status);
    order.status = normalizedStatus;
    await order.save();

    // Text the buyer when the order becomes ready to pick up (only on the transition, not on repeat saves).
    let sms;
    if (normalizedStatus === 'ready_to_pick_up' && previousStatus !== 'ready_to_pick_up') {
      const buyer = await User.findById(order.buyerId).exec().catch(() => null);
      const body = `Hi ${buyer?.displayName || order.buyerName || 'there'}, your order of ${order.quantity} kg ${order.productName || 'produce'} `
        + `from ${order.sellerName || 'your farmer'} is ready to pick up. Total: PHP ${order.totalPrice}. - Samar Farmers Marketplace`;
      sms = buyer ? await sendSms(buyer.phone, body) : { sent: false, error: 'Buyer not found' };
    }
    return res.json({ order: order.toJSONSafe(), ...(sms ? { sms } : {}) });
  } catch (e) {
    console.error('Update order status error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// List completed orders (delivered or collected) scoped to role
app.get('/orders/completed', authMiddleware, async (req, res) => {
  try {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
    const q = { status: { $in: ['ready_to_pick_up', 'completed', 'collected', 'delivered'] } };
    if (req.auth.role === 'buyer') q.buyerId = req.auth.uid;
    if (req.auth.role === 'farmer') q.sellerId = req.auth.uid;
    const docs = await Order.find(q).sort({ createdAt: -1 }).lean().exec();
    return res.json({ orders: docs.map(d => ({ ...d, id: d._id, status: normalizeOrderStatus(d.status) })) });
  } catch (e) {
    console.error('List completed orders error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// List reviews scoped to the signed-in user's role.
app.get('/reviews', authMiddleware, async (req, res) => {
  try {
    const query = req.auth.role === 'admin'
      ? {}
      : req.auth.role === 'farmer'
        ? { sellerId: req.auth.uid }
        : { buyerId: req.auth.uid };
    const reviews = await Review.find(query).sort({ createdAt: -1 }).exec();
    return res.json({ reviews: reviews.map(review => review.toJSONSafe()) });
  } catch (e) {
    console.error('List reviews error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Buyers can review an order only after it is completed, once per order.
app.post('/reviews', authMiddleware, async (req, res) => {
  try {
    if (req.auth.role !== 'buyer') return res.status(403).json({ error: 'Only buyers can submit reviews' });
    const { orderId, rating, comment } = req.body || {};
    const numericRating = Number(rating);
    if (!orderId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !String(comment || '').trim()) {
      return res.status(400).json({ error: 'Order, rating, and review comment are required' });
    }

    const order = await Order.findOne({ _id: orderId, buyerId: req.auth.uid }).exec();
    if (!order) return res.status(404).json({ error: 'Completed order not found' });
    const normalizedStatus = normalizeOrderStatus(order.status);
    if (normalizedStatus !== 'completed') return res.status(400).json({ error: 'Reviews are available only for completed orders' });
    if (await Review.exists({ orderId: order._id.toString() })) return res.status(409).json({ error: 'This order has already been reviewed' });

    const buyer = await User.findById(req.auth.uid).exec();
    const review = await Review.create({
      orderId: order._id.toString(),
      buyerId: req.auth.uid,
      buyerName: buyer?.displayName || order.buyerName || 'Buyer',
      sellerId: order.sellerId,
      productId: order.productId,
      rating: numericRating,
      comment: String(comment).trim()
    });
    return res.status(201).json({ review: review.toJSONSafe() });
  } catch (e) {
    console.error('Create review error:', e);
    if (e.code === 11000) return res.status(409).json({ error: 'This order has already been reviewed' });
    return res.status(500).json({ error: String(e) });
  }
});

// Read messages for a product conversation. Buyers see their conversations; farmers see their inbox.
app.get('/messages', authMiddleware, async (req, res) => {
  try {
    const productId = String(req.query.productId || '');
    const query = req.auth.role === 'farmer'
      ? { sellerId: req.auth.uid }
      : { buyerId: req.auth.uid, ...(productId ? { productId } : {}) };
    if (productId && req.auth.role === 'farmer') query.productId = productId;
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(500).exec();
    return res.json({ messages: messages.map(message => message.toJSONSafe()) });
  } catch (e) {
    console.error('List messages error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Send a message between a buyer and the farmer selling the selected product.
app.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { productId, message } = req.body || {};
    const text = String(message || '').trim();
    if (!productId || !text) return res.status(400).json({ error: 'Product and message are required' });
    const product = await Product.findById(productId).exec();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!['buyer', 'farmer'].includes(req.auth.role)) return res.status(403).json({ error: 'Only buyers and farmers can chat' });
    if (req.auth.role === 'farmer' && req.auth.uid !== product.sellerId) return res.status(403).json({ error: 'You do not own this product' });
    if (req.auth.role === 'farmer' && !req.body.buyerId) return res.status(400).json({ error: 'Buyer is required' });

    const sender = await User.findById(req.auth.uid).exec();
    const isBuyer = req.auth.role === 'buyer';
    const buyer = isBuyer ? sender : await User.findById(req.body.buyerId).exec();
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
    const chatMessage = await Message.create({
      productId: product._id.toString(),
      productName: product.name,
      buyerId: isBuyer ? req.auth.uid : String(req.body.buyerId || ''),
      buyerName: buyer.displayName || 'Buyer',
      sellerId: product.sellerId,
      sellerName: product.sellerName || 'Farmer',
      senderId: req.auth.uid,
      senderRole: req.auth.role,
      message: text
    });
    return res.status(201).json({ message: chatMessage.toJSONSafe() });
  } catch (e) {
    console.error('Create message error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Get user profile
app.get('/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const user = await User.findById(uid).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ profile: user.toProfile() });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// List users (admin only)
app.get('/users', authMiddleware, async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const docs = await User.find().sort({ createdAt: -1 }).lean().exec();
    return res.json({ users: docs.map(d => d.toProfile ? d : ({ uid: d._id, email: d.email, displayName: d.displayName, role: d.role, municipality: d.municipality, isApproved: d.isApproved, createdAt: d.createdAt })) });
  } catch (e) {
    console.error('List users error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Update user profile (admin approval)
app.put('/users/:uid', authMiddleware, async (req, res) => {
  try {
    const uid = req.params.uid;
    const updates = req.body || {};

    const allowed = ['isApproved', 'role', 'municipality', 'bio', 'farmingPractices', 'phone', 'photoURL', 'primaryProducts', 'location', 'displayName', 'houseNo', 'street', 'barangay', 'favorites'];
    // Build set/unset payloads. Treat explicit null as request to unset (move back to pending).
    const setPayload = {};
    const unsetPayload = {};
    for (const k of Object.keys(updates)) {
      if (!allowed.includes(k)) continue;
      // null means unset the field
      if (updates[k] === null) {
        unsetPayload[k] = '';
      } else {
        setPayload[k] = updates[k];
      }
    }

    if (Object.keys(setPayload).length === 0 && Object.keys(unsetPayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // If attempting to change admin-only fields, ensure requester is admin
    const adminOnly = ['isApproved', 'role'];
    const requestedAdminChanges = Object.keys(setPayload).concat(Object.keys(unsetPayload)).some(k => adminOnly.includes(k));
    if (requestedAdminChanges) {
      if (!req.auth || req.auth.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change approval or role' });
      }
    }

    // Allow users to update their own profile (non-admin fields)
    if (req.auth && req.auth.uid !== uid && req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    const updateOps = {};
    if (Object.keys(setPayload).length) updateOps['$set'] = setPayload;
    if (Object.keys(unsetPayload).length) updateOps['$unset'] = unsetPayload;

    const user = await User.findByIdAndUpdate(uid, updateOps, { new: true }).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Propagate location/municipality changes to products sold by this user
    try {
      const prodUpdate = {};
      if (user.municipality) prodUpdate['municipality'] = user.municipality;
      if (user.location) prodUpdate['location'] = user.location;
      if (Object.keys(prodUpdate).length) {
        await Product.updateMany({ sellerId: uid }, { $set: prodUpdate }).exec();
      }
    } catch (e) {
      console.error('Failed to propagate user location to products:', e);
    }
    return res.json({ profile: user.toProfile() });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Set user location and address (auth: user themselves or admin)
app.post('/users/:uid/location', authMiddleware, async (req, res) => {
  try {
    const uid = req.params.uid;
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
    if (req.auth.uid !== uid && req.auth.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { location, street, houseNo, barangay, municipality } = req.body || {};
    const setPayload = {};
    const unsetPayload = {};
    if (location === null) unsetPayload['location'] = '';
    else if (location) setPayload['location'] = location;
    if (street === null) unsetPayload['street'] = '';
    else if (street !== undefined) setPayload['street'] = street;
    if (houseNo === null) unsetPayload['houseNo'] = '';
    else if (houseNo !== undefined) setPayload['houseNo'] = houseNo;
    if (barangay === null) unsetPayload['barangay'] = '';
    else if (barangay !== undefined) setPayload['barangay'] = barangay;
    if (municipality === null) unsetPayload['municipality'] = '';
    else if (municipality !== undefined) setPayload['municipality'] = municipality;

    const updateOps = {};
    if (Object.keys(setPayload).length) updateOps['$set'] = setPayload;
    if (Object.keys(unsetPayload).length) updateOps['$unset'] = unsetPayload;
    if (Object.keys(updateOps).length === 0) return res.status(400).json({ error: 'No location fields provided' });

    const user = await User.findByIdAndUpdate(uid, updateOps, { new: true }).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Propagate location/municipality changes to products sold by this user
    try {
      const prodUpdate = {};
      if (user.municipality) prodUpdate['municipality'] = user.municipality;
      if (user.location) prodUpdate['location'] = user.location;
      if (Object.keys(prodUpdate).length) {
        await Product.updateMany({ sellerId: uid }, { $set: prodUpdate }).exec();
      }
    } catch (e) {
      console.error('Failed to propagate user location to products:', e);
    }
    return res.json({ profile: user.toProfile() });
  } catch (e) {
    console.error('Set user location error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Geocode an address (proxy to Nominatim) — returns { lat, lng, display_name }
app.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body || {};
    if (!address) return res.status(400).json({ error: 'Missing address' });
    const q = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Samar-Farmers-App/1.0 (+https://example.local)' } });
    const data = await resp.json();
    if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
    const first = data[0];
    return res.json({ lat: parseFloat(first.lat), lng: parseFloat(first.lon), display_name: first.display_name });
  } catch (e) {
    console.error('Geocode error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Reverse geocode lat/lng to address (proxy to Nominatim)
app.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body || {};
    if (lat === undefined || lng === undefined) return res.status(400).json({ error: 'Missing lat/lng' });
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Samar-Farmers-App/1.0 (+https://example.local)' } });
    const data = await resp.json();
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ display_name: data.display_name, address: data.address });
  } catch (e) {
    console.error('Reverse geocode error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Explicit approve route for convenience: admin approves a farmer
app.post('/users/:uid/approve', authMiddleware, async (req, res) => {
  try {
    if (!req.auth || req.auth.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const uid = req.params.uid;
    const user = await User.findByIdAndUpdate(uid, { isApproved: true }, { new: true }).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ profile: user.toProfile() });
  } catch (err) {
    console.error('Approve user error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Health endpoint
app.get('/_health', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState; // 1 = connected
    let usersTest = null;
    try {
      const one = await User.findOne().lean().exec();
      usersTest = { foundAny: !!one };
    } catch (e) {
      usersTest = { error: e.message || String(e) };
    }
    return res.json({ ok: true, mongoState, usersTest });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Temporary debug route: list recent users (do NOT enable in production)
app.get('/debug/users', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || '10'));
    const docs = await User.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
    return res.json({ count: docs.length, users: docs.map(d => ({ uid: d._id, email: d.email, displayName: d.displayName, role: d.role, isApproved: d.isApproved, createdAt: d.createdAt })) });
  } catch (e) {
    console.error('Debug users error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Debug DB info
app.get('/debug/dbinfo', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 1 = connected
    const dbName = mongoose.connection?.db?.databaseName || null;
    const host = mongoose.connection?.host || null;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const usersCount = await User.countDocuments().exec();
    return res.json({ state, dbName, host, collections: collections.map(c => c.name), usersCount });
  } catch (e) {
    console.error('Debug dbinfo error:', e);
    return res.status(500).json({ error: String(e) });
  }
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      setTimeout(() => startServer(port + 1), 500);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(Number(PORT));
