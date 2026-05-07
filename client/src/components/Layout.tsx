import React from 'react';
import { UserProfile } from '../types';
import { LogOut, User, ShoppingCart, LayoutDashboard, Map as MapIcon, Leaf, ShoppingBag, Star, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  user: UserProfile;
  onSignOut: () => void;
  children: React.ReactNode;
  activeView?: string;
  onViewChange?: (view: any) => void;
  pendingApprovalsCount?: number;
}

export function Layout({ user, onSignOut, children, activeView, onViewChange, pendingApprovalsCount = 0 }: LayoutProps) {
  const isBuyer = user.role === 'buyer';
  const isFarmer = user.role === 'farmer';

  const handleSignOut = () => {
    toast.info('Signing out...', {
      description: 'Please wait while we securely log you out.',
      duration: 1500,
    });
    setTimeout(onSignOut, 1000);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar */}
      {!isBuyer && (
        <aside className="w-64 bg-emerald-900 text-white flex flex-col fixed h-full z-50">
          <div className="p-6 flex items-center gap-2">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-xl font-bold leading-tight">Samar Farmers<br/><span className="text-sm font-normal text-emerald-400">Online Marketplace</span></h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Dashboard" 
              active={activeView === 'dashboard'} 
              onClick={() => onViewChange?.('dashboard')}
            />
            {user.role === 'admin' && (
              <>
                <NavItem 
                  icon={<ShieldCheck className="w-5 h-5" />} 
                  label="Approvals" 
                  active={activeView === 'approvals'} 
                  onClick={() => onViewChange?.('approvals')}
                  badge={pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined}
                />
                <NavItem 
                  icon={<Users className="w-5 h-5" />} 
                  label="User Management" 
                  active={activeView === 'users'} 
                  onClick={() => onViewChange?.('users')}
                />
              </>
            )}
            {isFarmer && (
              <>
                <NavItem 
                  icon={<ShoppingBag className="w-5 h-5" />} 
                  label="Active Orders" 
                  active={activeView === 'orders'} 
                  onClick={() => onViewChange?.('orders')}
                />
                <NavItem 
                  icon={<CheckCircle2 className="w-5 h-5" />} 
                  label="Completed Orders" 
                  active={activeView === 'completed_orders'} 
                  onClick={() => onViewChange?.('completed_orders')}
                />
                <NavItem 
                  icon={<MapIcon className="w-5 h-5" />} 
                  label="Location" 
                  active={activeView === 'location'} 
                  onClick={() => onViewChange?.('location')}
                />

            {/* Layout Reviews sidebar farmer--------------------------------------- */}
                {/* <NavItem 
                  icon={<Star className="w-5 h-5" />} 
                  label="Reviews" 
                  active={activeView === 'reviews'} 
                  onClick={() => onViewChange?.('reviews')}
                /> */}
              </>
            )}

            {/* Layout Profile sidebar farmer--------------------------------------- */}
            {/* <NavItem 
              icon={<User className="w-5 h-5" />} 
              label="Profile" 
              active={activeView === 'profile'} 
              onClick={() => onViewChange?.('profile')}
            /> */}
          </nav>

          <div className="p-4 border-t border-emerald-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center">
                {user.displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-emerald-400 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!isBuyer ? 'ml-64 p-8' : ''}`}>
        {children}
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick, 
  badge 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-800 text-white shadow-lg' 
          : 'text-emerald-300 hover:bg-emerald-800/50 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}
