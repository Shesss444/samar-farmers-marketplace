export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  municipality?: string;
  street?: string;
  houseNo?: string;
  barangay?: string;
  photoURL?: string;
  bio?: string;
  farmingPractices?: string[];
  createdAt: string;
  location?: {
    lat: number;
    lng: number;
  };
  favorites?: string[];
  isApproved?: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  price: number;
  quantity: number;
  category: 'vegetables' | 'fruits' | 'rice' | 'root crops' | 'others';
  imageUrl: string;
  imagePosition?: string;
  description: string;
  farmerBio?: string;
  farmingPractices?: string[];
  municipality: string;
  createdAt: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'collected' | 'delivered';
  deliveryDate: string;
  createdAt: string;
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

export const MUNICIPALITIES = [
  'Catbalogan', 'Calbayog', 'Borongan', 'Guiuan', 'Catarman', 
  'Basey', 'Calbiga', 'Gandara', 'Laoang', 'Palapag',
  'Almagro', 'Daram', 'Hinabangan', 'Jiabong', 'Marabut', 
  'Matuguinao', 'Motiong', 'Pagsanghan', 'Paranas', 'Pinabacdao', 
  'San Jorge', 'San Jose de Buan', 'San Sebastian', 'Santa Margarita', 
  'Santa Rita', 'Santo Niño', 'Tagapul-an', 'Talalora', 'Tarangnan', 
  'Villareal', 'Zumarraga'
].sort();

export const CATEGORIES = ['vegetables', 'fruits', 'rice', 'root crops', 'others'] as const;
