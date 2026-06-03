export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role?: string;
  userCode?: string;
  balance: number; // in INR
  verified: boolean;
  tradesCompleted: number;
  rating: number; // out of 5
  joinDate: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  level: number;
  rp: string; // e.g. "Maxed out", "Season 10-15"
  skins: number; // Number of rare skins
  popularity: number; // e.g. 500000
  status: "active" | "in_trade" | "sold";
  createdAt: string;
  sellerRating?: number;
  sellerTrades?: number;
  sellerName?: string;
  images?: string[];
  video?: string;
  linkedAccounts?: string;
}

export type TradeStatus = 
  | "pending"          // Escrow locked, waiting for seller credentials
  | "credentials_sent" // Seller provided details, waiting for buyer test
  | "disputed"         // Issue raised
  | "completed"        // Buyer released payment
  | "cancelled";       // Cancelled by mutual consent or auto-timeout

export interface Trade {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: TradeStatus;
  credentials?: { loginId: string; password?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  tradeId: string;
  senderId: string; // 'system' for system messages
  text: string;
  timestamp: string;
}

export interface Review {
  id: string;
  tradeId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  tradeId?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  method: string;
  paymentDetails: any;
  createdAt: string;
}
