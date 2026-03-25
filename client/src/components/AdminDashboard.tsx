import React from 'react';
import { UserProfile, Product, Order, MUNICIPALITIES } from '../types';
import { Users, Package, ShoppingBag, BarChart3, ShieldCheck, TrendingUp, Loader2, User, MapPin, Info, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdminDashboardProps {
  user: UserProfile;
  users: UserProfile[];
  products: Product[];
  orders: Order[];
  onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void;
  activeView?: string;
}

export function AdminDashboard({ user, users, products, orders, onUpdateUser, activeView = 'dashboard' }: AdminDashboardProps) {
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [viewingFarmer, setViewingFarmer] = React.useState<UserProfile | null>(null);

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Products', value: products.length, icon: <Package className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Revenue', value: `₱${orders.reduce((acc, o) => acc + o.totalPrice, 0)}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
  ];

  const pendingFarmers = users.filter(u => u.role === 'farmer' && u.isApproved === undefined);
  const rejectedFarmers = users.filter(u => u.role === 'farmer' && u.isApproved === false);

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

  if (activeView === 'approvals') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Farmer Approvals</h2>
            <p className="text-stone-500">Review and approve new farmer registrations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Pending Requests */}
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-stone-50">
              <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Pending Requests ({pendingFarmers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              {pendingFarmers.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldCheck className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                  <p className="text-stone-500">No pending farmer approvals at the moment.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-bottom border-stone-100">
                      <th className="px-8 py-4 text-sm font-bold text-stone-600">Farmer</th>
                      <th className="px-8 py-4 text-sm font-bold text-stone-600">Municipality</th>
                      <th className="px-8 py-4 text-sm font-bold text-stone-600">Farmer Details</th>
                      <th className="px-8 py-4 text-sm font-bold text-stone-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {pendingFarmers.map(u => (
                      <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{u.displayName}</p>
                              <p className="text-xs text-stone-400">{u.email}</p>
                              <p className="text-[10px] text-stone-400 mt-1">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm">{u.municipality}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 max-w-xs">
                          <div className="space-y-2">
                            {u.bio && (
                              <p className="text-xs text-stone-500 line-clamp-2 italic">"{u.bio}"</p>
                            )}
                            {u.farmingPractices && u.farmingPractices.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {u.farmingPractices.slice(0, 2).map(p => (
                                  <span key={p} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full uppercase">
                                    {p}
                                  </span>
                                ))}
                                {u.farmingPractices.length > 2 && (
                                  <span className="text-[9px] text-stone-400 font-bold">+{u.farmingPractices.length - 2} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setViewingFarmer(u)}
                              className="px-4 py-2 bg-stone-100 text-stone-600 text-xs font-bold rounded-xl hover:bg-stone-200 transition-colors"
                            >
                              Review
                            </button>
                            <button 
                              onClick={() => onUpdateUser(u.uid, { isApproved: true })}
                              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => onUpdateUser(u.uid, { isApproved: false })}
                              className="px-4 py-2 bg-stone-100 text-stone-600 text-xs font-bold rounded-xl hover:bg-stone-200 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Rejected/Denied Requests */}
          {rejectedFarmers.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm opacity-75">
              <div className="p-8 border-b border-stone-50 bg-stone-50/50">
                <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  Rejected Requests ({rejectedFarmers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-bottom border-stone-100">
                      <th className="px-8 py-4 text-sm font-bold text-stone-600">Farmer</th>
                      <th className="px-8 py-4 text-sm font-bold text-stone-600">Municipality</th>
                      <th className="px-8 py-4 text-sm font-bold text-stone-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {rejectedFarmers.map(u => (
                      <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{u.displayName}</p>
                              <p className="text-xs text-stone-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-stone-600">{u.municipality}</td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => onUpdateUser(u.uid, { isApproved: undefined })}
                            className="px-4 py-2 text-emerald-600 text-xs font-bold hover:underline transition-colors"
                          >
                            Re-review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Farmer Detail Modal */}
        {viewingFarmer && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
                    {viewingFarmer.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-900">{viewingFarmer.displayName}</h3>
                    <p className="text-stone-500">{viewingFarmer.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingFarmer(null)}
                  className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Municipality</p>
                    <p className="text-stone-800 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {viewingFarmer.municipality}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Registration Date</p>
                    <p className="text-stone-800 font-medium">
                      {new Date(viewingFarmer.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">About the Farmer</p>
                  <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100 italic">
                    {viewingFarmer.bio || "No bio provided."}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Farming Practices</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingFarmer.farmingPractices && viewingFarmer.farmingPractices.length > 0 ? (
                      viewingFarmer.farmingPractices.map(p => (
                        <span key={p} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                          <Leaf className="w-3 h-3" />
                          {p}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-stone-400">No practices specified.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-stone-50 border-t border-stone-100 flex gap-4">
                <button 
                  onClick={() => {
                    onUpdateUser(viewingFarmer.uid, { isApproved: true });
                    setViewingFarmer(null);
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                >
                  Approve Application
                </button>
                <button 
                  onClick={() => {
                    onUpdateUser(viewingFarmer.uid, { isApproved: false });
                    setViewingFarmer(null);
                  }}
                  className="flex-1 py-4 bg-white border border-stone-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98]"
                >
                  Reject Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'users') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">User Management</h2>
            <p className="text-stone-500">Manage all registered users in the system.</p>
          </div>
          {editingUser && (
            <button 
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Back to List
            </button>
          )}
        </div>

        {editingUser ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm max-w-4xl">
            <h3 className="text-xl font-bold text-stone-800 mb-8 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Manage Profile: {editingUser.displayName}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={editingUser.displayName}
                      onChange={(e) => onUpdateUser(editingUser.uid, { displayName: e.target.value })}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">System Role</label>
                    <select 
                      defaultValue={editingUser.role}
                      onChange={(e) => onUpdateUser(editingUser.uid, { role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="farmer">Farmer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">Municipality</label>
                    <select 
                      defaultValue={editingUser.municipality}
                      onChange={(e) => onUpdateUser(editingUser.uid, { municipality: e.target.value })}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Municipality</option>
                      {MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {editingUser.role === 'farmer' && (
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <div>
                        <p className="text-sm font-bold text-stone-800">Account Approval</p>
                        <p className="text-xs text-stone-500">Enable/disable farmer listing capabilities</p>
                      </div>
                      <button 
                        onClick={() => onUpdateUser(editingUser.uid, { isApproved: !editingUser.isApproved })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          editingUser.isApproved 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {editingUser.isApproved ? 'Approved' : 'Pending Approval'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Extended Profile (Farmer Specific) */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Profile Details
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-500 uppercase">Bio / Description</label>
                    <textarea 
                      rows={4}
                      defaultValue={editingUser.bio}
                      placeholder="Tell us about this user..."
                      onChange={(e) => onUpdateUser(editingUser.uid, { bio: e.target.value })}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    />
                  </div>
                  {editingUser.role === 'farmer' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500 uppercase">Farming Practices (Comma separated)</label>
                      <input 
                        type="text" 
                        defaultValue={editingUser.farmingPractices?.join(', ')}
                        placeholder="Organic, No Pesticides, etc."
                        onChange={(e) => onUpdateUser(editingUser.uid, { 
                          farmingPractices: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') 
                        })}
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Changes are saved automatically as you edit.
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                All Users ({users.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-bottom border-stone-100">
                    <th className="px-8 py-4 text-sm font-bold text-stone-600">User</th>
                    <th className="px-8 py-4 text-sm font-bold text-stone-600">Role</th>
                    <th className="px-8 py-4 text-sm font-bold text-stone-600">Municipality</th>
                    <th className="px-8 py-4 text-sm font-bold text-stone-600">Status</th>
                    <th className="px-8 py-4 text-sm font-bold text-stone-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600">
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{u.displayName}</p>
                            <p className="text-xs text-stone-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === 'farmer' ? 'bg-emerald-50 text-emerald-600' :
                          u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-stone-600">{u.municipality || 'N/A'}</td>
                      <td className="px-8 py-4">
                        {u.role === 'farmer' && !u.isApproved ? (
                          <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Pending
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4" />
                            Active
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="text-blue-600 hover:text-blue-900 transition-colors font-bold text-xs uppercase tracking-widest"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'profile') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Admin Profile</h2>
          <p className="text-stone-500">Manage your administrative account details.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm max-w-2xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold">
              {user.displayName.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900">{user.displayName}</h3>
              <p className="text-stone-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  defaultValue={user.displayName}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user.email}
                  disabled
                  className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>
            <button className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Admin Control Panel</h2>
          <p className="text-stone-500">System-wide monitoring and management.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-5"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">{stat.label}</p>
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
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
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
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
        </div>
      </div> */}
    </div>
  );
}
