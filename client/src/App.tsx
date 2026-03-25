/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Product, Order, Review } from './types';
import { Auth } from './components/Auth';
import { FarmerDashboard } from './components/FarmerDashboard';
import { BuyerInterface } from './components/BuyerInterface';
import { AdminDashboard } from './components/AdminDashboard';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sellerId: 'farmer-id',
    sellerName: 'Juan Dela Cruz',
    name: 'Fresh Samar Rice',
    price: 50,
    quantity: 100,
    category: 'rice',
    imageUrl: 'https://picsum.photos/seed/rice/400/300',
    description: 'High-quality organic rice from the fields of Calbiga.',
    farmerBio: 'Farmer Juan has been cultivating the fertile lands of Calbiga for over 20 years. He is dedicated to preserving traditional Samar rice varieties.',
    farmingPractices: ['Organic Fertilizers', 'Crop Rotation', 'No Pesticides'],
    municipality: 'Calbiga',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p2',
    sellerId: 'farmer-id',
    sellerName: 'Juan Dela Cruz',
    name: 'Organic Sweet Potatoes',
    price: 35,
    quantity: 50,
    category: 'root crops',
    imageUrl: 'https://picsum.photos/seed/potato/400/300',
    description: 'Sweet and nutritious root crops harvested daily.',
    farmerBio: 'Farmer Juan has been cultivating the fertile lands of Calbiga for over 20 years. He is dedicated to preserving traditional Samar rice varieties.',
    farmingPractices: ['Organic Fertilizers', 'Crop Rotation', 'No Pesticides'],
    municipality: 'Calbiga',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([
    { uid: 'admin-id', email: 'admin@example.com', displayName: 'System Admin', role: 'admin', isApproved: true, createdAt: new Date().toISOString() },
    { uid: 'farmer-id', email: 'farmer@example.com', displayName: 'Juan Dela Cruz', role: 'farmer', municipality: 'Catbalogan', isApproved: true, createdAt: new Date().toISOString() },
    { uid: 'buyer-id', email: 'buyer@example.com', displayName: 'Maria Clara', role: 'buyer', municipality: 'Calbayog', isApproved: true, createdAt: new Date().toISOString() },
    { 
      uid: 'farmer-pending-1', 
      email: 'pedro@example.com', 
      displayName: 'Pedro Penduko', 
      role: 'farmer', 
      municipality: 'Basey', 
      isApproved: undefined, 
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      bio: 'I am a traditional rice farmer looking to expand my market reach.',
      farmingPractices: ['Organic', 'No Pesticides']
    },
    { 
      uid: 'farmer-pending-2', 
      email: 'liza@example.com', 
      displayName: 'Liza Soberano', 
      role: 'farmer', 
      municipality: 'Calbiga', 
      isApproved: undefined, 
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      bio: 'Specializing in root crops and organic vegetables.',
      farmingPractices: ['Composting', 'Natural Irrigation']
    },
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'o1',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      sellerName: 'Juan Dela Cruz',
      productId: 'p1',
      productName: 'Premium Samar Rice',
      quantity: 2,
      totalPrice: 240,
      status: 'delivered',
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'o2',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      sellerName: 'Juan Dela Cruz',
      productId: 'p2',
      productName: 'Sweet Potatoes (Kamote)',
      quantity: 1,
      totalPrice: 45,
      status: 'delivered',
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'o3',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      sellerName: 'Juan Dela Cruz',
      productId: 'p3',
      productName: 'Fresh Calamansi',
      quantity: 5,
      totalPrice: 150,
      status: 'pending',
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'o4',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      sellerName: 'Juan Dela Cruz',
      productId: 'p4',
      productName: 'Fresh Calamansi',
      quantity: 3,
      totalPrice: 90,
      status: 'collected',
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ]);
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'r1',
      orderId: 'o1',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      productId: 'p1',
      rating: 5,
      comment: 'The rice is very fresh and high quality! Highly recommended.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'r2',
      orderId: 'o2',
      buyerId: 'buyer-id',
      buyerName: 'Maria Clara',
      sellerId: 'farmer-id',
      productId: 'p2',
      rating: 4,
      comment: 'Sweet potatoes are good, but some were small.',
      createdAt: new Date().toISOString()
    }
  ]);
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogin = (profile: UserProfile) => {
    setUsers(prev => {
      if (prev.find(u => u.uid === profile.uid)) return prev;
      return [...prev, profile];
    });
    setUser(profile);
    setActiveView('dashboard');
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setProducts([...products, newProduct]);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addOrder = (newOrders: Omit<Order, 'id' | 'createdAt'>[]) => {
    const formattedOrders = newOrders.map(o => ({
      ...o,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }));
    setOrders([...orders, ...formattedOrders]);
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setReviews([...reviews, newReview]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateUser = (uid: string, updates: Partial<UserProfile>) => {
    setUsers(users.map(u => u.uid === uid ? { ...u, ...updates } : u));
    if (user?.uid === uid) {
      setUser({ ...user, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleLogin} />;
  }

  const renderContent = () => {
    switch (user.role) {
      case 'farmer':
        if (!user.isApproved) {
          return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-stone-100 shadow-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Account Pending Approval</h2>
              <p className="text-stone-500 max-w-md mx-auto">
                Your farmer account has been created successfully. For security and quality assurance, our administrators need to review and approve your account before you can start listing products.
              </p>
              <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600">
                You will be able to access your dashboard once an admin approves your request.
              </div>
            </div>
          );
        }
        return (
          <FarmerDashboard 
            user={user} 
            products={products.filter(p => p.sellerId === user.uid)}
            orders={orders.filter(o => o.sellerId === user.uid)}
            reviews={reviews.filter(r => r.sellerId === user.uid)}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
            onUpdateOrderStatus={updateOrderStatus}
            onUpdateUser={updateUser}
            activeView={activeView}
          />
        );
      case 'buyer':
        return (
          <BuyerInterface 
            user={user} 
            products={products.filter(p => {
              const seller = users.find(u => u.uid === p.sellerId);
              return seller ? seller.isApproved !== false : true;
            })}
            orders={orders.filter(o => o.buyerId === user.uid)}
            reviews={reviews}
            onPlaceOrder={addOrder}
            onAddReview={addReview}
            onSignOut={handleSignOut}
            onUpdateUser={updateUser}
          />
        );
      case 'admin':
        return (
          <AdminDashboard 
            user={user} 
            products={products}
            orders={orders}
            users={users}
            onUpdateUser={updateUser}
            activeView={activeView}
          />
        );
      default:
        return <div>Invalid Role</div>;
    }
  };

  const pendingApprovalsCount = users.filter(u => u.role === 'farmer' && u.isApproved === undefined).length;

  return (
    <Layout 
      user={user} 
      onSignOut={handleSignOut} 
      activeView={activeView} 
      onViewChange={setActiveView}
      pendingApprovalsCount={pendingApprovalsCount}
    >
      {renderContent()}
    </Layout>
  );
}
