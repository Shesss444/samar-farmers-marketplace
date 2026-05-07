import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserProfile, Product, Order, Review, CATEGORIES, MUNICIPALITIES } from '../types';
import { Plus, Package, ShoppingBag, Calendar, Trash2, Edit2, Loader2, CheckCircle2, Clock, MapPin, Save, Map as MapIcon, User, Mail, Phone, Building, Search, Star, Info, Leaf, TrendingUp, BarChart3, AlertTriangle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FarmerDashboardProps {
  user: UserProfile;
  products: Product[];
  orders: Order[];
  reviews: Review[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void;
  activeView: string;
}

// Default center for Samar (Catbalogan area)
const SAMAR_CENTER = { lat: 11.78, lng: 124.88 };

export function FarmerDashboard({ user, products, orders, reviews, onAddProduct, onDeleteProduct, onUpdateProduct, onUpdateOrderStatus, onUpdateUser, activeView }: FarmerDashboardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt'>>({
    sellerId: user.uid,
    sellerName: user.displayName,
    name: '',
    price: 0,
    quantity: 0,
    category: 'vegetables',
    imageUrl: 'https://picsum.photos/seed/product/400/300',
    imagePosition: 'center',
    description: '',
    kilograms: 0,
    farmerBio: user.bio || '',
    farmingPractices: user.farmingPractices || [],
    municipality: user.municipality || 'Catbalogan',
    location: user.location ? { lat: user.location.lat, lng: user.location.lng } : undefined
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update newProduct location if user location changes
  useEffect(() => {
    if (user.location) {
      setNewProduct(prev => ({
        ...prev,
        location: { lat: user.location!.lat, lng: user.location!.lng },
        municipality: user.municipality || prev.municipality
      }));
    }
  }, [user.location, user.municipality]);

  // Mock data for charts
  const chartData = [
    { name: 'Mon', orders: 12, revenue: 4500 },
    { name: 'Tue', orders: 19, revenue: 5200 },
    { name: 'Wed', orders: 15, revenue: 4800 },
    { name: 'Thu', orders: 22, revenue: 6100 },
    { name: 'Fri', orders: 30, revenue: 8500 },
    { name: 'Sat', orders: 45, revenue: 12000 },
    { name: 'Sun', orders: 10, revenue: 3000 },
  ];

  const lowStockProducts = products.filter(p => p.quantity < 10);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, newProduct);
      toast.success('Product updated successfully!', {
        description: `${newProduct.name} has been updated.`,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      });
      setEditingProduct(null);
    } else {
      onAddProduct(newProduct);
      toast.success('Product added successfully!', {
        description: `${newProduct.name} is now listed.`,
        icon: <Plus className="w-5 h-5 text-emerald-500" />
      });
    }
    setShowAddModal(false);
    setNewProduct({
      sellerId: user.uid,
      sellerName: user.displayName,
      name: '',
      price: 0,
      quantity: 0,
      category: 'vegetables',
      imageUrl: 'https://picsum.photos/seed/product/400/300',
      imagePosition: 'center',
      description: '',
      kilograms: 0,
      farmerBio: user.bio || '',
      farmingPractices: user.farmingPractices || [],
      municipality: user.municipality || 'Catbalogan'
    });
  };

  const handleDeleteProduct = (id: string, name: string) => {
    onDeleteProduct(id);
    toast.error('Product deleted', {
      description: `${name} has been removed from your listings.`,
      icon: <Trash2 className="w-5 h-5 text-red-500" />
    });
  };

  const handleUpdateOrderStatus = (id: string, status: Order['status'], productName: string) => {
    onUpdateOrderStatus(id, status);
    toast.info(`Order ${status}`, {
      description: `Order for ${productName} is now ${status}.`,
      icon: status === 'delivered' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-orange-500" />
    });
  };

  const handleUpdateUser = (uid: string, updates: Partial<UserProfile>) => {
    onUpdateUser(uid, updates);
    toast.success('Profile updated', {
      description: 'Your changes have been saved successfully.',
      icon: <Save className="w-5 h-5 text-emerald-500" />
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      imageUrl: product.imageUrl,
      imagePosition: product.imagePosition || 'center',
      description: product.description,
      kilograms: product.kilograms || 0,
      farmerBio: product.farmerBio || user.bio || '',
      farmingPractices: product.farmingPractices || user.farmingPractices || [],
      municipality: product.municipality,
      location: product.location
    });
    setShowAddModal(true);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'orders':
        return <OrdersSection orders={orders.filter(o => o.status !== 'delivered')} onUpdateOrderStatus={handleUpdateOrderStatus} title="Active Orders" />;
      case 'completed_orders':
        return <OrdersSection orders={orders.filter(o => o.status === 'delivered')} onUpdateOrderStatus={handleUpdateOrderStatus} title="Completed Orders" />;
      case 'location':
        return <LocationSection user={user} onUpdateUser={handleUpdateUser} />;
      case 'profile':
        return <ProfileSection user={user} onUpdateUser={handleUpdateUser} />;
      case 'reviews':
        return <ReviewsSection reviews={reviews} />;
      default:
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-3xl font-bold text-stone-900">Farmer Dashboard</h2>
                <p className="text-stone-500">Manage your products and track weekly orders.</p>
              </div>
              <div className="flex items-center gap-4">
                {lowStockProducts.length > 0 && (
                  <div className="relative">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
                      <Bell className="w-6 h-6" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {lowStockProducts.length}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </button>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <AnimatePresence>
              {lowStockProducts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-orange-50 border border-orange-100 rounded-3xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg font-bold text-orange-900">Low Stock Alerts</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-sm font-bold text-stone-900">{p.name}</p>
                            <p className="text-xs text-orange-600 font-bold">{p.quantity} units left</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => openEditModal(p)}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <StatCard 
                icon={<Package className="w-6 h-6 text-emerald-600" />} 
                label="Total Products" 
                value={products.length} 
                color="bg-emerald-50"
              />
              <StatCard 
                icon={<ShoppingBag className="w-6 h-6 text-blue-600" />} 
                label="Active Orders" 
                value={orders.filter(o => o.status !== 'delivered').length} 
                color="bg-blue-50"
              />
              <StatCard 
                icon={<ShoppingBag className="w-6 h-6 text-orange-600" />} 
                label="Total Orders" 
                value={orders.length} 
                color="bg-orange-50"
              />
              <StatCard 
                icon={<TrendingUp className="w-6 h-6 text-purple-600" />} 
                label="Total Revenue" 
                value={`₱${orders.reduce((acc, o) => acc + o.totalPrice, 0)}`} 
                color="bg-purple-50"
              />
              <StatCard 
                icon={<Star className="w-6 h-6 text-yellow-600" />} 
                label="Rating" 
                value={reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'} 
                color="bg-yellow-50"
              />
            </div>

            {/* Charts Section farmers------------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Weekly Revenue
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div> */}

              {/* <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Order Volume
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div> */}
            </div>

            {/* Products Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-stone-800">Your Products</h3>
              </div>
              {products.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-12 text-center">
                  <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500">No products listed yet. Start by adding your first product!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <motion.div 
                      layout
                      key={product.id} 
                      className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          style={{ objectPosition: product.imagePosition || 'center' }}
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-wider">
                            {product.category}
                          </div>
                          {product.quantity < 10 && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-stone-900 text-lg">{product.name}</h4>
                          <span className="text-emerald-600 font-bold">₱{product.price}</span>
                        </div>
                        <p className="text-stone-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                          <div className={`flex items-center gap-1 text-xs font-bold ${product.quantity < 10 ? 'text-red-500' : 'text-stone-400'}`}>
                            <Package className="w-3 h-3" />
                            <span>Stock: {product.quantity} {product.kilograms ? `(${product.kilograms}kg)` : ''}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditModal(product)}
                              className="p-2 text-stone-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
            
            <OrdersSection 
              orders={orders
                .filter(o => o.status !== 'delivered')
                .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
                .slice(0, 5)} 
              onUpdateOrderStatus={handleUpdateOrderStatus} 
              title="Recent Active Orders" 
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderContent()}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-bold text-stone-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    setNewProduct({
                      sellerId: user.uid,
                      sellerName: user.displayName,
                      name: '',
                      price: 0,
                      quantity: 0,
                      category: 'vegetables',
                      imageUrl: 'https://picsum.photos/seed/product/400/300',
                      imagePosition: 'center',
                      description: '',
                      kilograms: 0,
                      municipality: user.municipality || 'Catbalogan'
                    });
                  }} 
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Fresh Baguio Beans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Price (₱)</label>
                    <input 
                      required
                      type="number" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Stock Quantity</label>
                    <input 
                      required
                      type="number" 
                      value={newProduct.quantity}
                      onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Weight (kg)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={newProduct.kilograms}
                      onChange={e => setNewProduct({...newProduct, kilograms: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. 1.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Category</label>
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Product Image</label>
                    <div className="flex flex-col gap-4">
                      <div className="aspect-video w-full rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden relative group">
                        <img 
                          src={newProduct.imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          style={{ objectPosition: newProduct.imagePosition || 'center' }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white text-stone-900 rounded-lg font-bold text-sm shadow-lg"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Adjust Center Position</label>
                          <span className="text-xs font-mono text-stone-400">{newProduct.imagePosition || 'center'}</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={newProduct.imagePosition === 'center' ? 50 : parseInt(newProduct.imagePosition?.split(' ')[1] || '50')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewProduct({ ...newProduct, imagePosition: `center ${val}%` });
                          }}
                          className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase">
                          <span>Top</span>
                          <span>Center</span>
                          <span>Bottom</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Description</label>
                    <textarea 
                      required
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
                      placeholder="Describe your product..."
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Farmer Bio (Optional)</label>
                    <textarea 
                      value={newProduct.farmerBio}
                      onChange={e => setNewProduct({...newProduct, farmerBio: e.target.value})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                      placeholder="Tell buyers about yourself and your farm..."
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Farming Practices (Comma separated)</label>
                    <input 
                      type="text" 
                      value={newProduct.farmingPractices?.join(', ')}
                      onChange={e => setNewProduct({...newProduct, farmingPractices: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Organic, No Pesticides, Sustainable"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all"
                >
                  {editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersSection({ orders, onUpdateOrderStatus, title = "Orders" }: { orders: Order[]; onUpdateOrderStatus: (id: string, status: Order['status'], productName: string) => void; title?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = orders
    .filter(order => 
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-800">{title}</h3>
          <span className="bg-stone-100 text-stone-500 text-xs font-bold px-2 py-1 rounded-full">
            {orders.length}
          </span>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium">No orders found matching your search.</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={order.id}
              className="group bg-white rounded-3xl border border-stone-100 p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
            >
              {/* Order ID & Date */}
              <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Order ID</span>
                <span className="font-mono text-xs text-stone-600">#{order.id.slice(0, 8)}</span>
                <div className="flex items-center gap-1 text-stone-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px]">{order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 flex items-center gap-4">
                <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 overflow-hidden border border-stone-100">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{order.productName}</h4>
                  <p className="text-xs text-stone-500">Quantity: <span className="font-bold text-stone-700">{order.quantity}</span></p>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="flex items-center gap-3 md:w-48">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-xs font-bold">
                  {order.buyerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">{order.buyerName}</p>
                  <p className="text-[10px] text-stone-400">Buyer</p>
                </div>
              </div>

              {/* Price */}
              <div className="md:w-24">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Price</p>
                <p className="text-lg font-bold text-emerald-600">₱{order.totalPrice}</p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 md:w-64 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                <div className="flex flex-col items-start md:items-end gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest md:hidden">Status</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    order.status === 'pending' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'collected' ? 'bg-orange-50 text-orange-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      order.status === 'pending' ? 'bg-blue-600' :
                      order.status === 'collected' ? 'bg-orange-600' :
                      'bg-emerald-600'
                    }`} />
                    {order.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(order.id, 'collected', order.productName)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all text-xs font-bold"
                    >
                      <Clock className="w-4 h-4" />
                      Mark Collected
                    </button>
                  )}
                  {order.status === 'collected' && (
                    <button 
                      onClick={() => onUpdateOrderStatus(order.id, 'delivered', order.productName)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Delivered
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-400 rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function LocationSection({ user, onUpdateUser }: { user: UserProfile; onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void }) {
  const [location, setLocation] = useState({
    lat: user.location?.lat || SAMAR_CENTER.lat,
    lng: user.location?.lng || SAMAR_CENTER.lng,
  });
  const [address, setAddress] = useState({
    street: user.street || '',
    houseNo: user.houseNo || '',
    barangay: user.barangay || ''
  });
  const [municipality, setMunicipality] = useState(user.municipality || 'Catbalogan');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const API = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000';
      const query = `${address.houseNo || ''} ${address.street || ''} ${address.barangay || ''} ${municipality} Samar Philippines`.trim();
      const resp = await fetch(`${API}/geocode`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: query }) });
      if (resp.ok) {
        const data = await resp.json();
        const newLat = data.lat;
        const newLng = data.lng;
        setLocation(prev => ({ ...prev, lat: newLat, lng: newLng }));
        if (mapRef.current) mapRef.current.setView([newLat, newLng], 15);
      } else {
        // fallback to municipality
        const fb = await fetch(`${API}/geocode`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: municipality + ' Samar Philippines' }) });
        if (fb.ok) {
          const fallbackData = await fb.json();
          const newLat = fallbackData.lat;
          const newLng = fallbackData.lng;
          setLocation(prev => ({ ...prev, lat: newLat, lng: newLng }));
          if (mapRef.current) mapRef.current.setView([newLat, newLng], 13);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLocating(false);
    }
  };

  // Reverse geocode helper to fetch address details for a lat/lng
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const API = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000';
      const res = await fetch(`${API}/reverse-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (!res.ok) return null;
      const d = await res.json();
      const addr = d.address || {};
      const street = addr.road || addr.pedestrian || addr.footway || addr.house_number || '';
      const barangay = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || '';
      const municipalityGuess = addr.town || addr.city || addr.county || addr.municipality || addr.state || '';
      return { street, barangay, municipalityGuess, display_name: d.display_name };
    } catch (e) {
      console.error('Reverse geocode error', e);
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const API = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000';
      const token = localStorage.getItem('idToken');
      const res = await fetch(`${API}/users/${user.uid}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          location,
          street: address.street || null,
          houseNo: address.houseNo || null,
          barangay: address.barangay || null,
          municipality: municipality || null
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error('Save location failed', e);
        toast.error('Failed to save location');
        setSaving(false);
        return;
      }
      const d = await res.json();
      const profile = d.profile;
      onUpdateUser(user.uid, profile);
    } catch (err) {
      console.error('Save location error', err);
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  // Autosave location/address changes after short debounce so farmer profile is persisted automatically
  const autoSaveTimer = useRef<number | null>(null);
  const firstAutoSave = useRef(true);
  useEffect(() => {
    // skip first render to avoid unnecessary save on mount
    if (firstAutoSave.current) {
      firstAutoSave.current = false;
      return;
    }

    // debounce saves to avoid spamming the backend while dragging marker
    if (autoSaveTimer.current) {
      window.clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = window.setTimeout(async () => {
      try {
        const API = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000';
        const token = localStorage.getItem('idToken');
        const res = await fetch(`${API}/users/${user.uid}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            location,
            street: address.street || null,
            houseNo: address.houseNo || null,
            barangay: address.barangay || null,
            municipality: municipality || null
          })
        });
        if (res.ok) {
          const d = await res.json();
          const profile = d.profile;
          // update parent state silently so UI reflects persisted profile
          onUpdateUser(user.uid, profile);
        }
      } catch (e) {
        console.error('Auto-save location error', e);
      }
    }, 1500) as unknown as number;

    return () => {
      if (autoSaveTimer.current) {
        window.clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, address.street, address.barangay, municipality]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Farm Location</h2>
          <p className="text-stone-500">Pin your farm's exact location for easier buyer discovery.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="bg-stone-100 hover:bg-stone-200 disabled:bg-stone-50 text-stone-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Locate on Map
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Location
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm h-[500px] relative">
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={13} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker 
              position={[location.lat, location.lng]}
              draggable={true}
              eventHandlers={{
                dragend: async (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  const newLoc = { ...location, lat: position.lat, lng: position.lng };
                  setLocation(newLoc);
                  const info = await reverseGeocode(position.lat, position.lng);
                  if (info) {
                    setAddress(prev => ({ ...prev, street: info.street || prev.street, barangay: info.barangay || prev.barangay }));
                    if (info.municipalityGuess) setMunicipality(info.municipalityGuess);
                    toast.success('Address updated from map');
                  }
                },
              }}
            />
            <MapEvents onClick={async (lat, lng) => {
              setLocation({ ...location, lat, lng });
              const info = await reverseGeocode(lat, lng);
              if (info) {
                setAddress(prev => ({ ...prev, street: info.street || prev.street, barangay: info.barangay || prev.barangay }));
                if (info.municipalityGuess) setMunicipality(info.municipalityGuess);
                toast.success('Address updated from map click');
              }
            }} />
          </MapContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h4 className="font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Address Details (Samar)
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Municipality</label>
                <select 
                  value={municipality}
                  onChange={e => setMunicipality(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Barangay</label>
                <input 
                  type="text"
                  value={address.barangay || ''}
                  onChange={e => setAddress({ ...address, barangay: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Brgy. 1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Street / House No.</label>
                <input 
                  type="text"
                  value={address.street || ''}
                  onChange={e => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Mabini St."
                />
              </div>

              <div className="pt-4 border-t border-stone-50">
                <p className="text-xs text-stone-400 mb-2">GPS COORDINATES</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Latitude</p>
                    <p className="text-sm font-mono font-bold text-stone-600">{location.lat.toFixed(6)}</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl">
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Longitude</p>
                    <p className="text-sm font-mono font-bold text-stone-600">{location.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <p className="text-sm text-emerald-800 leading-relaxed">
              <strong>Tip:</strong> You can drag the marker on the map or click anywhere to set your farm's location. This helps buyers see exactly where their food comes from!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ user, onUpdateUser }: { user: UserProfile, onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [primaryProducts, setPrimaryProducts] = useState(user.primaryProducts?.join(', ') || '');
  const [practices, setPractices] = useState(user.farmingPractices?.join(', ') || '');

  const handleSave = () => {
    onUpdateUser(user.uid, {
      bio,
      phone,
      primaryProducts: primaryProducts.split(',').map(s => s.trim()).filter(s => s !== ''),
      farmingPractices: practices.split(',').map(s => s.trim()).filter(s => s !== '')
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Farmer Profile</h2>
          <p className="text-stone-500">Manage your personal information and farm details.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            isEditing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-16 h-16 text-emerald-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-stone-900">{user.displayName}</h3>
            <p className="text-stone-500 text-sm uppercase tracking-wider font-bold mt-1">{user.role}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h4 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Farmer Bio
            </h4>
            {isEditing ? (
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[150px] text-sm"
                placeholder="Tell buyers about yourself and your farm..."
              />
            ) : (
              <p className="text-sm text-stone-600 leading-relaxed italic">
                {user.bio ? `"${user.bio}"` : "No bio added yet. Tell buyers your story!"}
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h4 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Full Name</label>
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <User className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">{user.displayName}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-700">{user.phone || 'Not Set'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Municipality</label>
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <Building className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">{user.municipality || 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h4 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              Farming Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Primary Products</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={primaryProducts}
                    onChange={e => setPrimaryProducts(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="Rice, Corn, etc."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    {user.primaryProducts && user.primaryProducts.length > 0 ? (
                      user.primaryProducts.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">{p}</span>
                      ))
                    ) : (
                      <span className="text-stone-400 text-xs italic">Not Set</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Farming Practices</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={practices}
                    onChange={e => setPractices(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="e.g. Organic, No Pesticides, Sustainable"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    {user.farmingPractices && user.farmingPractices.length > 0 ? (
                      user.farmingPractices.map((practice, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {practice}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-stone-400 italic">No farming practices added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h4 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Farm Details
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <MapIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Current Location</p>
                  {user.location ? (
                    <p className="text-sm text-stone-500">
                      {user.houseNo && `${user.houseNo} `}
                      {user.street && `${user.street}, `}
                      {user.barangay && `${user.barangay}, `}
                      {user.municipality}, Samar
                    </p>
                  ) : (
                    <p className="text-sm text-stone-400 italic">No location set yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-stone-900">Customer Reviews</h2>
        <p className="text-stone-500">See what buyers are saying about your products.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-12 text-center">
            <Star className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No reviews yet. Keep providing great service!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-500">
                    {review.buyerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{review.buyerName}</h4>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-stone-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed italic">"{review.comment}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-5 bg-white`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <p className="text-2xl font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}
