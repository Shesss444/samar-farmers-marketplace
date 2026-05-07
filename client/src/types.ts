export type UserRole = 'admin' | 'farmer' | 'buyer';

export interface Location { lat: number; lng: number }

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  municipality?: string;
  isApproved?: boolean | null;
  createdAt: string;
  bio?: string;
  farmingPractices?: string[];
  phone?: string;
  primaryProducts?: string[];
  location?: Location;
  houseNo?: string;
  street?: string;
  barangay?: string;
  photoURL?: string;
  favorites?: string[];
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
  imagePosition?: string;
  description: string;
  kilograms?: number;
  farmerBio?: string;
  farmingPractices?: string[];
  municipality?: string;
  location?: Location;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName?: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'collected' | 'delivered';
  deliveryDate?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const CATEGORIES = [
  'vegetables',
  'fruits',
  'rice',
  'root crops',
  'others'
] as const;

export type Category = typeof CATEGORIES[number];

export const MUNICIPALITIES = [
  'Catbalogan','Calbayog','Borongan','Guiuan','Catarman','Basey','Calbiga','Gandara','Laoang','Palapag','Almagro','Daram','Hinabangan','Jiabong','Marabut','Matuguinao','Motiong','Pagsanghan','Paranas','Pinabacdao','San Jorge','San Jose de Buan','San Sebastian','Santa Margarita','Santa Rita','Santo Niño','Tagapul-an','Talalora','Tarangnan','Villareal','Zumarraga'
];
