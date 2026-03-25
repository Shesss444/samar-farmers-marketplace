import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Product, Order, Review, CATEGORIES, MUNICIPALITIES } from '../types';
import { Search, Map as MapIcon, ShoppingCart, Package, Calendar, MapPin, X, Info, Leaf, ChevronRight, Store, ArrowLeft, User, LogOut, UserCircle, Navigation, Loader2, Save, Building, HelpCircle, Star, CreditCard, Bell, Settings, Heart, Edit3, Filter, Minus, Plus, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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

const STADIA_API_KEY = process.env.STADIA_MAPS_API_KEY || '8179bbf0-843f-4ba0-9df5-e5c94bb43035';
const hasValidKey = Boolean(STADIA_API_KEY);

// Default coordinates for municipalities in Samar
const MUNICIPALITY_COORDS: Record<string, { lat: number, lng: number }> = {
  'Catbalogan': { lat: 11.78, lng: 124.88 },
  'Calbayog': { lat: 12.07, lng: 124.60 },
  'Borongan': { lat: 11.61, lng: 125.43 },
  'Guiuan': { lat: 11.03, lng: 125.72 },
  'Catarman': { lat: 12.50, lng: 124.64 },
  'Basey': { lat: 11.28, lng: 125.07 },
  'Calbiga': { lat: 11.62, lng: 124.99 },
  'Gandara': { lat: 11.99, lng: 124.81 },
  'Laoang': { lat: 12.57, lng: 125.01 },
  'Palapag': { lat: 12.48, lng: 125.12 },
  'Almagro': { lat: 11.91, lng: 124.29 },
  'Daram': { lat: 11.60, lng: 124.80 },
  'Hinabangan': { lat: 11.68, lng: 125.04 },
  'Jiabong': { lat: 11.76, lng: 124.95 },
  'Marabut': { lat: 11.18, lng: 125.23 },
  'Matuguinao': { lat: 12.14, lng: 124.88 },
  'Motiong': { lat: 11.79, lng: 124.94 },
  'Pagsanghan': { lat: 11.96, lng: 124.80 },
  'Paranas': { lat: 11.78, lng: 125.02 },
  'Pinabacdao': { lat: 11.64, lng: 124.97 },
  'San Jorge': { lat: 11.99, lng: 124.81 },
  'San Jose de Buan': { lat: 12.05, lng: 125.03 },
  'San Sebastian': { lat: 11.70, lng: 125.01 },
  'Santa Margarita': { lat: 12.03, lng: 124.66 },
  'Santa Rita': { lat: 11.45, lng: 124.95 },
  'Santo Niño': { lat: 11.89, lng: 124.44 },
  'Tagapul-an': { lat: 12.06, lng: 124.26 },
  'Talalora': { lat: 11.48, lng: 124.83 },
  'Tarangnan': { lat: 11.90, lng: 124.75 },
  'Villareal': { lat: 11.55, lng: 124.93 },
  'Zumarraga': { lat: 11.63, lng: 124.84 }
};

function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface BuyerInterfaceProps {
  user: UserProfile;
  products: Product[];
  orders: Order[];
  reviews: Review[];
  onPlaceOrder: (orders: Omit<Order, 'id' | 'createdAt'>[]) => void;
  onAddReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  onSignOut: () => void;
  onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void;
}

export function BuyerInterface({ user, products, orders, reviews, onPlaceOrder, onAddReview, onSignOut, onUpdateUser }: BuyerInterfaceProps) {
  const [view, setView] = useState<'marketplace' | 'orders' | 'profile' | 'favorites'>('marketplace');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [municipalityFilter, setMunicipalityFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info' | 'error'}[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.displayName);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const toggleFavorite = (productId: string) => {
    const currentFavorites = user.favorites || [];
    const isFavorite = currentFavorites.includes(productId);
    const newFavorites = isFavorite
      ? currentFavorites.filter(id => id !== productId)
      : [...currentFavorites, productId];
    
    onUpdateUser(user.uid, { favorites: newFavorites });
    addNotification(
      isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite ? 'info' : 'success'
    );
  };

  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Show guide automatically for first-time users
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem('hasSeenGuide', 'true');
    }
  }, []);

  const handleSubmitReview = () => {
    if (!reviewingOrder) return;
    
    onAddReview({
      orderId: reviewingOrder.id,
      buyerId: user.uid,
      buyerName: user.displayName,
      sellerId: reviewingOrder.sellerId,
      productId: reviewingOrder.productId,
      rating,
      comment,
    });
    
    addNotification('Feedback sent successfully!', 'success');
    setReviewingOrder(null);
    setRating(5);
    setComment('');
  };

  // Location state for profile
  const [tempLocation, setTempLocation] = useState<{ lat: number, lng: number } | null>(user.location || null);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState({
    street: user.street || '',
    houseNo: user.houseNo || '',
    barangay: user.barangay || '',
    municipality: user.municipality || 'Catbalogan'
  });

  const handleLocateOnMap = async () => {
    setIsLocating(true);
    try {
      const query = `${address.street} ${address.barangay} ${address.municipality} Samar Philippines`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setTempLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        // Fallback to municipality coords
        const coords = MUNICIPALITY_COORDS[address.municipality] || MUNICIPALITY_COORDS['Catbalogan'];
        setTempLocation(coords);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveLocation = () => {
    onUpdateUser(user.uid, {
      ...address,
      location: tempLocation || undefined
    });
    addNotification('Address saved successfully!', 'success');
  };

  // Fetch route from OSRM
  React.useEffect(() => {
    const fetchRoute = async () => {
      if (showRoute && user.location && selectedProduct) {
        setIsLoadingRoute(true);
        try {
          const sellerLat = selectedProduct.location?.lat || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lat || MUNICIPALITY_COORDS['Catbalogan'].lat;
          const sellerLng = selectedProduct.location?.lng || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lng || MUNICIPALITY_COORDS['Catbalogan'].lng;
          
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${user.location.lng},${user.location.lat};${sellerLng},${sellerLat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
            setRouteCoords(coords);
          } else {
            // Fallback to straight line if OSRM fails
            setRouteCoords([
              [user.location.lat, user.location.lng],
              [sellerLat, sellerLng]
            ]);
          }
        } catch (error) {
          console.error('Routing error:', error);
          // Fallback to straight line
          const sellerLat = selectedProduct.location?.lat || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lat || MUNICIPALITY_COORDS['Catbalogan'].lat;
          const sellerLng = selectedProduct.location?.lng || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lng || MUNICIPALITY_COORDS['Catbalogan'].lng;
          setRouteCoords([
            [user.location.lat, user.location.lng],
            [sellerLat, sellerLng]
          ]);
        } finally {
          setIsLoadingRoute(false);
        }
      } else {
        setRouteCoords([]);
      }
    };

    fetchRoute();
  }, [showRoute, user.location, selectedProduct]);

  const filteredProducts = products.filter((p: Product) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                         p.description.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesMunicipality = municipalityFilter === 'all' || p.municipality === municipalityFilter;
    
    const price = p.price;
    const matchesMinPrice = minPrice === '' || price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= parseFloat(maxPrice);
    
    const productReviews = reviews.filter(r => r.productId === p.id);
    const avgRating = productReviews.length > 0 
      ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length 
      : 0;
    const matchesRating = avgRating >= minRating;

    return matchesSearch && matchesCategory && matchesMunicipality && matchesMinPrice && matchesMaxPrice && matchesRating;
  });

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    addNotification(`${product.name} added to cart!`, 'success');
  };

  const handleCheckout = () => {
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
    if (nextSaturday.getDay() === 6 && new Date().getHours() > 12) {
      nextSaturday.setDate(nextSaturday.getDate() + 7);
    }
    const deliveryDate = nextSaturday.toISOString().split('T')[0];

    const newOrders = cart.map(item => ({
      buyerId: user.uid,
      buyerName: user.displayName,
      sellerId: item.product.sellerId,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      totalPrice: item.product.price * item.quantity,
      status: 'pending' as const,
      deliveryDate,
    }));

    onPlaceOrder(newOrders);
    setCart([]);
    setShowCart(false);
    setView('orders');
    addNotification('Order placed successfully!', 'success');
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalSpent = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;

  const guideSteps = [
    {
      target: 'search-bar',
      title: 'Find Fresh Produce',
      content: 'Type here to search for specific vegetables, fruits, or rice.',
      position: 'bottom' as const
    },
    {
      target: 'municipality-filter',
      title: 'Filter by Location',
      content: 'Select a municipality to find farmers near you.',
      position: 'right' as const
    },
    {
      target: 'product-grid',
      title: 'Browse Products',
      content: 'Click on any product to see its details and farm location.',
      position: 'top' as const
    },
    {
      target: 'cart-button',
      title: 'Your Shopping Basket',
      content: 'Click here to review your items and place your order.',
      position: 'bottom' as const
    },
    {
      target: 'user-menu',
      title: 'Your Account',
      content: 'Manage your profile and track your orders here.',
      position: 'bottom' as const
    }
  ];

  const GuideTooltip = ({ step }: { step: typeof guideSteps[0] }) => {
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
      const updateCoords = () => {
        const el = document.getElementById(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      };

      // Initial update
      updateCoords();
      
      // Scroll target into view
      const el = document.getElementById(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Update on resize and scroll to keep highlight aligned
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      
      // Periodic check for dynamic layouts
      const interval = setInterval(updateCoords, 100);

      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
        clearInterval(interval);
      };
    }, [step]);

    if (coords.width === 0) return null;

    const getTooltipPosition = () => {
      const margin = 16;
      switch (step.position) {
        case 'bottom':
          return { 
            top: coords.top + coords.height + margin, 
            left: coords.left + coords.width / 2,
            translateX: '-50%',
            translateY: 0
          };
        case 'top':
          return { 
            top: coords.top - margin, 
            left: coords.left + coords.width / 2,
            translateX: '-50%',
            translateY: '-100%'
          };
        case 'right':
          return { 
            top: coords.top + coords.height / 2, 
            left: coords.left + coords.width + margin,
            translateX: 0,
            translateY: '-50%'
          };
        default:
          return { 
            top: coords.top + coords.height + margin, 
            left: coords.left + coords.width / 2,
            translateX: '-50%',
            translateY: 0
          };
      }
    };

    const pos = getTooltipPosition();

    return (
      <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
        {/* Highlight Overlay */}
        <motion.div 
          layout
          className="absolute bg-emerald-600/10 border-2 border-emerald-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300"
          style={{
            top: coords.top - 8,
            left: coords.left - 8,
            width: coords.width + 16,
            height: coords.height + 16
          }}
        />

        {/* Tooltip */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: pos.top,
            left: pos.left,
            x: pos.translateX,
            y: pos.translateY
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute bg-white p-6 rounded-2xl shadow-2xl w-80 pointer-events-auto border border-emerald-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
              {guideStep + 1}
            </div>
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider">{step.title}</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">{step.content}</p>
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setShowGuide(false);
                localStorage.setItem('hasSeenGuide', 'true');
              }}
              className="text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              {guideStep > 0 && (
                <button 
                  onClick={() => setGuideStep(prev => prev - 1)}
                  className="px-3 py-1.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-lg hover:bg-stone-200 transition-colors uppercase tracking-widest"
                >
                  Back
                </button>
              )}
              <button 
                onClick={() => {
                  if (guideStep < guideSteps.length - 1) {
                    setGuideStep(prev => prev + 1);
                  } else {
                    setShowGuide(false);
                    localStorage.setItem('hasSeenGuide', 'true');
                  }
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
              >
                {guideStep === guideSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
          
          {/* Arrow */}
          <div 
            className={`absolute w-3 h-3 bg-white border-t border-l border-emerald-100 rotate-45 ${
              step.position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' :
              step.position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2 rotate-[225deg]' :
              'top-1/2 -left-1.5 -translate-y-1/2 -rotate-45'
            }`}
          />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Notifications Overlay */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[280px] ${
                n.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                n.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
                'bg-stone-900 border-stone-800 text-white'
              }`}
            >
              {n.type === 'success' ? <Package className="w-5 h-5" /> : 
               n.type === 'error' ? <X className="w-5 h-5" /> : 
               <Info className="w-5 h-5" />}
              <p className="text-sm font-bold">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Shopee-style Header */}
      <header className="bg-emerald-600 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* Mobile Menu Button - Only for Marketplace Filters */}
            {view === 'marketplace' && !selectedProduct && (
              <button 
                onClick={() => setShowFiltersSidebar(true)}
                className="p-2 hover:bg-emerald-700 rounded-full transition-colors sm:hidden"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => { setView('marketplace'); setSelectedProduct(null); }}
            >
              <Leaf className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <span className="text-lg md:text-2xl font-black tracking-tighter hidden xs:block">SAMAR MARKET</span>
            </div>

            {/* Search Bar - Desktop */}
            <div id="search-bar" className="flex-1 max-w-2xl relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Search for fresh farm products..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-4 pr-12 py-2 md:py-2.5 bg-white text-stone-900 rounded-sm shadow-sm focus:outline-none text-sm"
              />
              <button className="absolute right-1 top-1 bottom-1 px-3 md:px-4 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-6">
              <button 
                onClick={() => setShowGuide(true)}
                className="flex flex-col items-center gap-1 hover:text-emerald-100 transition-colors text-emerald-100/70"
                title="How to Buy?"
              >
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">Guide</span>
              </button>

              <button 
                onClick={() => setView('orders')}
                className={`flex items-center gap-2 hover:text-emerald-100 transition-colors ${view === 'orders' ? 'text-white' : 'text-emerald-100/70'}`}
              >
                <Package className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-sm font-medium hidden md:block">My Orders</span>
              </button>
              
              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  id="cart-button"
                  onClick={() => setShowCart(true)}
                  className="relative p-2 hover:bg-emerald-700 rounded-full transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-emerald-600 text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                      {cartCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button 
                    id="user-menu"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1 hover:bg-emerald-700 rounded-full transition-colors"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-400">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {showUserDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowUserDropdown(false)}
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-stone-100 z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b border-stone-50">
                            <p className="text-sm font-bold text-stone-900">{user.displayName}</p>
                            <p className="text-xs text-stone-500 truncate">{user.email}</p>
                          </div>
                          <div className="p-2">
                            <button 
                              onClick={() => { setView('profile'); setShowUserDropdown(false); setSelectedProduct(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                            >
                              <UserCircle className="w-4 h-4" />
                              See Profile
                            </button>
                            <button 
                              onClick={() => { setView('orders'); setShowUserDropdown(false); setSelectedProduct(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                            >
                              <Package className="w-4 h-4" />
                              Purchase history
                            </button>
                            <button 
                              onClick={() => { setView('favorites'); setShowUserDropdown(false); setSelectedProduct(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              My Favorites
                            </button>
                            <button 
                              onClick={() => {
                                addNotification('Signing out...', 'info');
                                setTimeout(onSignOut, 500);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 relative sm:hidden">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-12 py-2 bg-white text-stone-900 rounded-sm shadow-sm focus:outline-none text-sm"
            />
            <button className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 text-white rounded-sm">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {selectedProduct ? (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Back Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex items-center gap-2 text-stone-500 hover:text-emerald-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Marketplace
              </button>

              <div className="bg-white rounded-sm shadow-sm overflow-hidden flex flex-col lg:flex-row">
                {/* Product Images */}
                <div className="w-full lg:w-1/2 p-4 md:p-6 lg:p-8">
                  <div className="aspect-square rounded-sm overflow-hidden bg-stone-100 shadow-inner">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover" 
                      style={{ objectPosition: selectedProduct.imagePosition || 'center' }}
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="w-full lg:w-1/2 p-6 md:p-8 space-y-6 md:space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight">{selectedProduct.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                      <span className="text-emerald-600 font-black text-2xl md:text-3xl lg:text-4xl">₱{selectedProduct.price}</span>
                      <span className="px-2 py-1 bg-stone-100 text-stone-500 text-[10px] md:text-xs font-bold rounded uppercase tracking-widest border border-stone-200">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 bg-stone-50 rounded-sm border border-stone-100 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                        <Store className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate text-sm md:text-base">{selectedProduct.sellerName}</p>
                        <p className="text-xs md:text-sm text-stone-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {selectedProduct.municipality}, Samar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-stone-800 uppercase text-[10px] md:text-xs tracking-[0.2em] flex items-center gap-2">
                      <div className="w-4 h-px bg-emerald-500" />
                      Product Description
                    </h4>
                    <p className="text-stone-600 text-sm md:text-base leading-relaxed">{selectedProduct.description}</p>
                  </div>

                  {/* Farmer Details Section */}
                  {(selectedProduct.farmerBio || selectedProduct.farmingPractices) && (
                    <div className="pt-6 md:pt-8 border-t border-stone-100 space-y-4 md:space-y-6">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        <h4 className="font-bold text-stone-800 uppercase text-[10px] md:text-xs tracking-[0.2em]">Meet the Farmer</h4>
                      </div>
                      
                      {selectedProduct.farmerBio && (
                        <p className="text-stone-600 text-sm md:text-base leading-relaxed italic bg-emerald-50/30 p-4 rounded-sm border-l-2 border-emerald-500">
                          "{selectedProduct.farmerBio}"
                        </p>
                      )}

                      {selectedProduct.farmingPractices && selectedProduct.farmingPractices.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Farming Practices</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.farmingPractices.map((practice, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm"
                              >
                                <Leaf className="w-3 h-3" />
                                {practice}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 md:pt-8 border-t border-stone-100 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button 
                      onClick={() => addToCart(selectedProduct)}
                      className="flex-1 py-3.5 md:py-4 bg-emerald-50 text-emerald-600 font-bold rounded-sm border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 text-sm md:text-base shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => { addToCart(selectedProduct); setShowCart(true); }}
                      className="flex-1 py-3.5 md:py-4 bg-emerald-600 text-white font-bold rounded-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-sm md:text-base"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Seller Location Map */}
              <div className="bg-white rounded-sm shadow-sm p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-stone-900">Seller Location</h3>
                  </div>
                  {user.location && (
                    <button 
                      onClick={() => setShowRoute(!showRoute)}
                      disabled={isLoadingRoute}
                      className={`px-4 py-2 rounded-sm text-sm font-bold transition-all flex items-center gap-2 ${showRoute ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'} ${isLoadingRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoadingRoute ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className={`w-4 h-4 ${showRoute ? 'animate-pulse' : ''}`} />
                      )}
                      {isLoadingRoute ? 'Calculating...' : showRoute ? 'Hide Route' : 'Show Route from My Location'}
                    </button>
                  )}
                </div>
                <div className="h-[400px] bg-emerald-50/30 rounded-sm relative overflow-hidden border border-stone-100">
                  {hasValidKey ? (
                    <MapContainer 
                      center={[
                        selectedProduct.location?.lat || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lat || MUNICIPALITY_COORDS['Catbalogan'].lat,
                        selectedProduct.location?.lng || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lng || MUNICIPALITY_COORDS['Catbalogan'].lng
                      ]} 
                      zoom={selectedProduct.location ? 15 : 12} 
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                        url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`}
                      />
                      
                      {/* Seller Marker */}
                      <Marker 
                        position={[
                          selectedProduct.location?.lat || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lat || MUNICIPALITY_COORDS['Catbalogan'].lat,
                          selectedProduct.location?.lng || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lng || MUNICIPALITY_COORDS['Catbalogan'].lng
                        ]} 
                      >
                        <Popup>
                          <div className="p-1">
                            <p className="font-bold text-stone-900 mb-1">{selectedProduct.sellerName}'s Farm</p>
                            <p className="text-xs text-stone-500">{selectedProduct.municipality}, Samar</p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Buyer Marker */}
                      {showRoute && user.location && (
                        <>
                          <Marker 
                            position={[user.location.lat, user.location.lng]}
                            icon={L.divIcon({
                              className: 'custom-div-icon',
                              html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
                              iconSize: [12, 12],
                              iconAnchor: [6, 6]
                            })}
                          >
                            <Popup>Your Location</Popup>
                          </Marker>
                          {routeCoords.length > 0 && (
                            <Polyline 
                              positions={routeCoords}
                              color="#10b981"
                              weight={5}
                              opacity={0.8}
                            />
                          )}
                        </>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col p-8 text-center">
                      <MapPin className="w-12 h-12 text-stone-300 mb-4" />
                      <p className="text-stone-500">Stadia Maps API Key Required to view interactive map.</p>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-4 rounded-sm border border-stone-100 shadow-sm max-w-xs z-10">
                    <p className="text-sm font-bold text-stone-900">Farm Location</p>
                    <p className="text-xs text-stone-500 mt-1 mb-3">This product is sourced directly from a farm in {selectedProduct.municipality}, Samar.</p>
                    <button 
                      onClick={() => {
                        const lat = selectedProduct.location?.lat || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lat || MUNICIPALITY_COORDS['Catbalogan'].lat;
                        const lng = selectedProduct.location?.lng || MUNICIPALITY_COORDS[selectedProduct.municipality]?.lng || MUNICIPALITY_COORDS['Catbalogan'].lng;
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'marketplace' ? (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Quick Guide Banner */}
              <div className="bg-emerald-600 rounded-sm p-4 md:p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-600/20">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <div className="space-y-1 md:space-y-2 text-center md:text-left">
                    <h3 className="text-lg md:text-2xl font-bold">New here? Welcome to Samar Farm Market!</h3>
                    <p className="text-emerald-50/80 text-xs md:text-sm max-w-xl">Connecting you directly with local farmers in Samar. Fresh produce, fair prices, and zero middlemen.</p>
                  </div>
                  <button 
                    onClick={() => setShowGuide(true)}
                    className="w-full md:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-white text-emerald-600 font-bold rounded-sm hover:bg-emerald-50 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Start Guided Tour
                  </button>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-10 hidden md:block">
                  <Leaf className="w-64 h-64" />
                </div>
              </div>

              {/* Category Bar */}
              <div className="bg-white p-2 md:p-4 rounded-sm shadow-sm flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setShowGuide(true)}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 hover:bg-emerald-100 transition-colors shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  How to Buy?
                </button>
                <div className="h-6 w-px bg-stone-100 shrink-0" />
                <button 
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  All Products
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Filters & Grid */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Sidebar Filters (Desktop) */}
                <div id="municipality-filter" className="hidden md:block w-64 shrink-0 space-y-8">
                  <div className="space-y-4">
                      <h3 className="font-bold text-stone-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        By Municipality
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                        <button 
                          onClick={() => setMunicipalityFilter('all')}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${municipalityFilter === 'all' ? 'text-emerald-600 font-bold bg-emerald-50' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                          All Locations
                        </button>
                        {MUNICIPALITIES.map(m => (
                          <button 
                            key={m}
                            onClick={() => setMunicipalityFilter(m)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${municipalityFilter === m ? 'text-emerald-600 font-bold bg-emerald-50' : 'text-stone-500 hover:text-stone-900'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    {/* <div className="space-y-4">
                      <h3 className="font-bold text-stone-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Price Range
                      </h3>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          placeholder="Min" 
                          value={minPrice}
                          onChange={e => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-stone-400">-</span>
                        <input 
                          type="number" 
                          placeholder="Max" 
                          value={maxPrice}
                          onChange={e => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div> */}

                    {/* Rating Filter */}
                    {/* <div className="space-y-4">
                      <h3 className="font-bold text-stone-900 flex items-center gap-2">
                        <Star className="w-4 h-4 text-emerald-600" />
                        Customer Rating
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                        {[4, 3, 2, 1].map(star => (
                          <button 
                            key={star}
                            onClick={() => setMinRating(minRating === star ? 0 : star)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${minRating === star ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                          >
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < star ? 'text-yellow-400 fill-current' : 'text-stone-200'}`} />
                              ))}
                            </div>
                            <span className="hidden xs:inline">& up</span>
                          </button>
                        ))}
                      </div>
                    </div> */}

                    {/* Reset Filters */}
                    {(search || categoryFilter !== 'all' || municipalityFilter !== 'all' || minPrice || maxPrice || minRating > 0) && (
                      <button 
                        onClick={() => {
                          setSearch('');
                          setCategoryFilter('all');
                          setMunicipalityFilter('all');
                          setMinPrice('');
                          setMaxPrice('');
                          setMinRating(0);
                        }}
                        className="w-full py-2.5 text-xs font-bold text-emerald-600 border border-emerald-600 rounded hover:bg-emerald-50 transition-colors uppercase tracking-widest"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>

                {/* Product Grid */}
                <div id="product-grid" className="flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                      <motion.div 
                        layout
                        key={product.id} 
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white rounded-sm border border-stone-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            style={{ objectPosition: product.imagePosition || 'center' }}
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product.id);
                            }}
                            className={`absolute top-2 right-2 p-2 backdrop-blur-sm rounded-full transition-all z-10 ${
                              (user.favorites || []).includes(product.id)
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'bg-white/80 text-stone-400 hover:text-red-500 hover:bg-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${(user.favorites || []).includes(product.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                            {product.category}
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-stone-900 line-clamp-2 min-h-[40px]">{product.name}</h4>
                            <div className="flex items-center gap-0.5 mt-1 shrink-0">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-[10px] font-bold text-stone-400">
                                {reviews.filter(r => r.productId === product.id).length > 0
                                  ? (reviews.filter(r => r.productId === product.id).reduce((acc, r) => acc + r.rating, 0) / reviews.filter(r => r.productId === product.id).length).toFixed(1)
                                  : '0.0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-600 font-bold text-lg">₱{product.price}</span>
                            <span className="text-[10px] text-stone-400">{product.municipality}</span>
                          </div>
                          <button 
                            onClick={(e) => addToCart(product, e)}
                            className="w-full py-2 bg-stone-50 hover:bg-emerald-600 hover:text-white text-stone-600 text-xs font-bold rounded-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="py-20 text-center space-y-4 opacity-50">
                      <Search className="w-16 h-16 mx-auto text-stone-300" />
                      <p className="text-stone-500 font-medium text-lg">No products found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'profile' ? (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Orders</p>
                    <p className="text-xl md:text-2xl font-bold text-stone-900">{orders.length}</p>
                  </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Orders</p>
                    <p className="text-xl md:text-2xl font-bold text-stone-900">{activeOrdersCount}</p>
                  </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4 sm:col-span-2 md:col-span-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Spent</p>
                    <p className="text-xl md:text-2xl font-bold text-stone-900">₱{totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Profile Card & Quick Links */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="h-20 md:h-24 bg-emerald-600 relative">
                      <button 
                        onClick={() => {
                          if (isEditingProfile) {
                            onUpdateUser(user.uid, { displayName: editName });
                            addNotification('Profile updated!', 'success');
                          }
                          setIsEditingProfile(!isEditingProfile);
                        }}
                        className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                      >
                        {isEditingProfile ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="relative -mt-10 md:-mt-12 mb-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white p-1 shadow-lg mx-auto">
                          <div className="w-full h-full rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-10 h-10 md:w-12 md:h-12 text-stone-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        {isEditingProfile ? (
                          <input 
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-center text-lg md:text-xl font-bold text-stone-900 border-b-2 border-emerald-500 focus:outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          <h2 className="text-lg md:text-xl font-bold text-stone-900">{user.displayName}</h2>
                        )}
                        <p className="text-xs md:text-sm text-stone-500 truncate">{user.email}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2">
                          <UserCircle className="w-3 h-3" />
                          Buyer
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-2">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Bell className="w-4 h-4" />
                        </div>
                        {/* <span className="text-sm font-medium text-stone-700">Notifications</span> */}
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </button>
                    <button 
                      onClick={() => setView('favorites')}
                      className="w-full flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-stone-700">My Favorites</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-stone-700">Account Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </button>
                    <div className="my-2 border-t border-stone-100" />
                    <button 
                      onClick={onSignOut}
                      className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Address & Map */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-900">Delivery Address</h3>
                          <p className="text-xs text-stone-500">Where should we deliver your fresh produce?</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">House No. / Unit</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input 
                              type="text" 
                              value={address.houseNo}
                              onChange={e => setAddress({...address, houseNo: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                              placeholder="e.g. 123"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Street Name</label>
                          <input 
                            type="text" 
                            value={address.street}
                            onChange={e => setAddress({...address, street: e.target.value})}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            placeholder="e.g. Rizal St."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Barangay</label>
                          <input 
                            type="text" 
                            value={address.barangay}
                            onChange={e => setAddress({...address, barangay: e.target.value})}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            placeholder="e.g. Brgy. 1"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Municipality</label>
                          <select 
                            value={address.municipality}
                            onChange={e => setAddress({...address, municipality: e.target.value})}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                          >
                            {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="h-[250px] md:h-[300px] bg-stone-100 rounded-xl border border-stone-200 overflow-hidden relative">
                        {hasValidKey ? (
                          <MapContainer 
                            center={tempLocation ? [tempLocation.lat, tempLocation.lng] : [MUNICIPALITY_COORDS[address.municipality]?.lat || 11.78, MUNICIPALITY_COORDS[address.municipality]?.lng || 124.88]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                              url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`}
                            />
                            <LocationMarker position={tempLocation} setPosition={setTempLocation} />
                            {tempLocation && <MapUpdater center={[tempLocation.lat, tempLocation.lng]} />}
                          </MapContainer>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-[10px] md:text-xs p-8 text-center">
                            Stadia Maps API Key Required
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[10px] text-stone-500 border border-stone-200 z-[400]">
                          Click on the map to fine-tune your delivery location marker.
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={handleLocateOnMap}
                          disabled={isLocating}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-50"
                        >
                          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          Locate on Map
                        </button>
                        <button 
                          onClick={handleSaveLocation}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                          <Save className="w-4 h-4" />
                          Save Address
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'favorites' ? (
            <motion.div 
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-stone-900">My Favorites</h2>
                <button 
                  onClick={() => setView('marketplace')}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Marketplace
                </button>
              </div>

              {products.filter(p => (user.favorites || []).includes(p.id)).length === 0 ? (
                <div className="bg-white p-20 rounded-sm shadow-sm text-center border border-dashed border-stone-200">
                  <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 font-medium text-lg">You haven't added any favorites yet.</p>
                  <button 
                    onClick={() => setView('marketplace')}
                    className="mt-4 px-8 py-3 bg-emerald-600 text-white font-bold rounded-sm hover:bg-emerald-700 transition-colors"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.filter(p => (user.favorites || []).includes(p.id)).map(product => (
                    <motion.div 
                      layout
                      key={product.id} 
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white rounded-sm border border-stone-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          style={{ objectPosition: product.imagePosition || 'center' }}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white shadow-lg shadow-red-500/20 backdrop-blur-sm rounded-full transition-all z-10"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          {product.category}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-stone-900 line-clamp-2 min-h-[40px]">{product.name}</h4>
                          <div className="flex items-center gap-0.5 mt-1 shrink-0">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-[10px] font-bold text-stone-400">
                              {reviews.filter(r => r.productId === product.id).length > 0
                                ? (reviews.filter(r => r.productId === product.id).reduce((acc, r) => acc + r.rating, 0) / reviews.filter(r => r.productId === product.id).length).toFixed(1)
                                : '0.0'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-600 font-bold text-lg">₱{product.price}</span>
                          <span className="text-[10px] text-stone-400">{product.municipality}</span>
                        </div>
                        <button 
                          onClick={(e) => addToCart(product, e)}
                          className="w-full py-2 bg-stone-50 hover:bg-emerald-600 hover:text-white text-stone-600 text-xs font-bold rounded-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-stone-900">My Orders</h2>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm font-bold">
                    <Calendar className="w-4 h-4" />
                    Delivery every Saturday
                  </div>
                  <p className="text-[10px] text-stone-400 italic">Reviews become available once your order is collected or delivered.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {orders.length === 0 ? (
                  <div className="bg-white p-20 rounded-sm shadow-sm text-center border border-dashed border-stone-200">
                    <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500 font-medium text-lg">You haven't placed any orders yet.</p>
                    <button 
                      onClick={() => setView('marketplace')}
                      className="mt-4 px-8 py-3 bg-emerald-600 text-white font-bold rounded-sm hover:bg-emerald-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-sm flex items-center justify-center ${
                          order.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <Package className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-lg">{order.productName}</h4>
                          <p className="text-xs text-stone-400 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:max-w-xl">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Quantity</p>
                          <p className="font-bold text-stone-700">{order.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Total Paid</p>
                          <p className="font-bold text-emerald-600">₱{order.totalPrice}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Delivery Date</p>
                          <p className="font-bold text-stone-700">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-center ${
                        order.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {order.status}
                      </div>
                      {(order.status === 'delivered' || order.status === 'collected') && !reviews.find(r => r.orderId === order.id) && (
                        <button 
                          onClick={() => setReviewingOrder(order)}
                          className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                          Leave a Review
                        </button>
                      )}
                      {reviews.find(r => r.orderId === order.id) && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-xs font-bold">Reviewed</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-900 text-white">
                <h3 className="text-xl font-bold uppercase tracking-widest">Rate your experience</h3>
                <button onClick={() => setReviewingOrder(null)} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <p className="text-sm text-stone-500 mb-4">How was your order of <span className="font-bold text-stone-900">{reviewingOrder.productName}</span>?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 transition-colors ${rating >= star ? 'text-yellow-400' : 'text-stone-200'}`}
                      >
                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the quality and delivery..."
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] text-sm"
                  />
                </div>
                <button 
                  onClick={handleSubmitReview}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-sm hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <AnimatePresence>
        {showGuide && <GuideTooltip step={guideSteps[guideStep]} />}
      </AnimatePresence>

      {/* Filters Sidebar (Drawer) */}
      <AnimatePresence>
        {showFiltersSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersSidebar(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Filter className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Filters</h3>
                </div>
                <button onClick={() => setShowFiltersSidebar(false)} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Municipality Filter */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest">By Municipality</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setMunicipalityFilter('all')}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${municipalityFilter === 'all' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                      All Municipalities
                    </button>
                    {MUNICIPALITIES.map(m => (
                      <button 
                        key={m}
                        onClick={() => setMunicipalityFilter(m)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${municipalityFilter === m ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Price Range</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Min (₱)</label>
                      <input 
                        type="number" 
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Max (₱)</label>
                      <input 
                        type="number" 
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="1000"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Rating Filter */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Customer Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map(rating => (
                      <button 
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${minRating === rating ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-stone-200'}`} />
                          ))}
                        </div>
                        <span>& Up</span>
                      </button>
                    ))}
                    <button 
                      onClick={() => setMinRating(0)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${minRating === 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                      All Ratings
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100">
                <button 
                  onClick={() => setShowFiltersSidebar(false)}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sidebar (Drawer) */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Shopping Cart</h3>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingCart className="w-16 h-16 mb-4 text-stone-300" />
                    <p className="text-lg font-medium text-stone-500">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-4 rounded-sm border border-stone-100">
                      <img 
                        src={item.product.imageUrl} 
                        className="w-20 h-20 rounded-sm object-cover" 
                        style={{ objectPosition: item.product.imagePosition || 'center' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-stone-500 mt-1">₱{item.product.price} per unit</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button 
                            onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))}
                            className="w-7 h-7 rounded bg-stone-100 flex items-center justify-center font-bold hover:bg-stone-200"
                          >-</button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1} : i))}
                            className="w-7 h-7 rounded bg-stone-100 flex items-center justify-center font-bold hover:bg-stone-200"
                          >+</button>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-600 text-sm">₱{item.product.price * item.quantity}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-stone-600">Subtotal</span>
                  <span className="font-bold text-emerald-600 text-2xl">₱{cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-sm border border-blue-100 flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-800 leading-relaxed">
                    All orders are delivered every <span className="font-bold">Saturday</span>. Orders placed after Thursday 12:00 PM will be delivered the following week.
                  </p>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-sm shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-widest text-sm"
                >
                  Checkout Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
