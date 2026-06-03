import express from "express";
import path from "path";
import cors from "cors";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { User, Listing, Trade, ChatMessage, TradeStatus, Transaction, WithdrawalRequest, Review } from "./src/types";

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId);
const auth = getAuth(firebaseApp);

// Authenticate backend server anonymously
// signInAnonymously(auth).catch(console.error);

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let users: User[] = [];
let listings: Listing[] = [];
let trades: Trade[] = [];
let messages: ChatMessage[] = [];
let transactions: Transaction[] = [];
let withdrawals: WithdrawalRequest[] = [];
let reviews: Review[] = [];
let pendingDeposits: { txnid: string, userId: string, amount: number }[] = [];
let otps = new Map<string, string>(); // Contact -> OTP

// Data sync engine
const saveItem = (col: string, id: string, data: any) => setDoc(doc(db, col, id), data).catch(console.error);
const delItem = (col: string, id: string) => deleteDoc(doc(db, col, id)).catch(console.error);

let dbLoaded = false;
async function loadDb() {
  try {
    const [u, l, t, m, tx, w, rv] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "listings")),
      getDocs(collection(db, "trades")),
      getDocs(collection(db, "messages")),
      getDocs(collection(db, "transactions")),
      getDocs(collection(db, "withdrawals")),
      getDocs(collection(db, "reviews")),
    ]);
    if (u.docs.length > 0) users = u.docs.map(d => d.data() as User);
    if (l.docs.length > 0) listings = l.docs.map(d => d.data() as Listing);
    if (t.docs.length > 0) trades = t.docs.map(d => d.data() as Trade);
    if (m.docs.length > 0) messages = m.docs.map(d => d.data() as ChatMessage);
    if (tx.docs.length > 0) transactions = tx.docs.map(d => d.data() as Transaction);
    if (w.docs.length > 0) withdrawals = w.docs.map(d => d.data() as WithdrawalRequest);
    if (rv.docs.length > 0) reviews = rv.docs.map(d => d.data() as Review);
    console.log("Database initialized from Firebase!");
  } catch (e) {
    console.error("Failed to load Firebase DB:", e);
  } finally {
    dbLoaded = true;
  }
}
loadDb();

const lastState: any = {};
function syncToFirestore() {
  if (!dbLoaded) return;
  const checkCol = (colName: string, currentArr: any[]) => {
    if (!lastState[colName]) lastState[colName] = [];
    currentArr.forEach(item => {
      const prev = lastState[colName].find((x: any) => x.id === item.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
         saveItem(colName, item.id, item);
      }
    });
    // Check for deletions
    lastState[colName].forEach((item: any) => {
      if (!currentArr.find((x: any) => x.id === item.id)) {
        delItem(colName, item.id);
      }
    });
    // Update deep clone
    lastState[colName] = currentArr.map((x: any) => JSON.parse(JSON.stringify(x)));
  }
  checkCol("users", users);
  checkCol("listings", listings);
  checkCol("trades", trades);
  checkCol("messages", messages);
  checkCol("transactions", transactions);
  checkCol("withdrawals", withdrawals);
  checkCol("reviews", reviews);
}
setInterval(syncToFirestore, 2000);

// Sessions Map (token -> userId)
const sessions = new Map<string, string>();

const getUserId = (req: express.Request) => {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  return sessions.get(token) || null;
};

// API ROUTES
app.post("/api/messages", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { tradeId, text } = req.body;
  const trade = trades.find((t) => t.id === tradeId);
  const user = users.find((u) => u.id === userId);
  
  if (!trade || (trade.buyerId !== userId && trade.sellerId !== userId && user?.role !== 'admin')) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const msg: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    tradeId,
    senderId: userId,
    text,
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);
  res.json(msg);
});

// AUTH ROUTES
app.post("/api/send-otp", (req, res) => {
  const { contact } = req.body;
  if (!contact) return res.status(400).json({ error: "Contact info required" });
  
  const otp = "123456";
  otps.set(contact, otp);
  
  res.json({ success: true, message: `OTP sent successfully! For demo, use: 123456` });
});

app.post("/api/register", (req, res) => {
  const { name, email, phone, password, otp, uid } = req.body;
  if (!name || !email || !password || !phone || !otp) return res.status(400).json({ error: "Missing fields" });
  if (otp !== "verified_via_firebase" && otps.get(phone) !== otp) {
    return res.status(400).json({ error: "Invalid OTP verification" });
  }
  if (users.find(u => u.email === email || u.phone === phone)) {
    return res.status(400).json({ error: "Email or Phone already exists" });
  }
  if (otp !== "verified_via_firebase") {
     otps.delete(phone);
  }
  const newUser: any = {
    id: uid || `usr_${Math.random().toString(36).substr(2)}`,
    userCode: `UID-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    email,
    phone,
    password,
    balance: 0,
    verified: false,
    tradesCompleted: 0,
    rating: 0,
    joinDate: new Date().toISOString()
  };
  users.push(newUser);
  const token = `tok_${Math.random().toString(36).substr(2)}`;
  sessions.set(token, newUser.id);
  res.json({ token, user: newUser });
});

app.post("/api/firebase-login", (req, res) => {
  const { phone, uid } = req.body;
  if (!phone || !uid) return res.status(400).json({ error: "Missing Firebase credentials" });

  const user = users.find(u => u.phone === phone || u.id === uid);
  if (!user) return res.status(401).json({ error: "No account found with this phone number. Please register first." });

  // Update uid if generated previously without it
  if (user.id !== uid && user.id.startsWith("usr_")) {
    user.id = uid;
  }

  const token = `tok_${Math.random().toString(36).substr(2)}`;
  sessions.set(token, user.id);
  res.json({ token, user });
});

app.post("/api/login", (req, res) => {
  const { email, loginId, password, useOtp, otp } = req.body;
  const loginKey = email || loginId;
  
  if (loginKey === "kalki" && password === "Singh2005@") {
    let adminUser = users.find(u => u.id === "admin1");
    if (!adminUser) {
      adminUser = {
        id: "admin1",
        userCode: "UID-8888",
        name: "System Admin",
        email: "kalki",
        password: "Singh2005@",
        role: "admin",
        balance: 9999999,
        verified: true,
        tradesCompleted: 999,
        rating: 5.0,
        joinDate: "2023-01-01T00:00:00Z",
      } as any;
      users.push(adminUser);
    }
    
    const token = `tok_admin_${Math.random().toString(36).substr(2)}`;
    sessions.set(token, adminUser.id);
    return res.json({ token, user: adminUser });
  }

  const user = users.find(u => u.email === loginKey || u.phone === loginKey);
  if (!user) return res.status(401).json({ error: "No account found with these details." });
  
  if (useOtp) {
    if (otps.get(loginKey) !== otp) return res.status(401).json({ error: "Invalid OTP" });
    otps.delete(loginKey);
  } else {
    if (user.password !== password) return res.status(401).json({ error: "Invalid password" });
  }

  const token = `tok_${Math.random().toString(36).substr(2)}`;
  sessions.set(token, user.id);
  res.json({ token, user });
});

app.post("/api/logout", (req, res) => {
  const auth = req.headers.authorization;
  if (auth) {
    const token = auth.split(" ")[1];
    sessions.delete(token);
  }
  res.json({ success: true });
});

// API ROUTES
app.get("/api/me", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  
  // Omit password
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Wallet Operations
app.get("/api/wallet/transactions", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  res.json(transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.post("/api/wallet/deposit", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { amount, utrNumber } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  // Mock auto verification
  user.balance += Number(amount);
  
  transactions.push({
    id: `txn_${Math.random().toString(36).substr(2)}`,
    userId: user.id,
    type: "deposit",
    amount: Number(amount),
    balanceAfter: user.balance,
    description: `Deposit via UTR: ${utrNumber || 'N/A'}`,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, balance: user.balance });
});

import Razorpay from "razorpay";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sx4rlAqSP0N0An',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'JzMLJVJq4dSscjisHqIB39DJ',
});

app.post("/api/create-order", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const { amount } = req.body; // in INR rupees
  if (!amount || amount < 1) return res.status(400).json({ error: "Invalid amount" });

  try {
    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `rcpt_${userId}_${Date.now()}`,
    };
    
    const order = await razorpayInstance.orders.create(options);
    
    pendingDeposits.push({ txnid: order.id, userId, amount: Number(amount) });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/verify-payment", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const deposit = pendingDeposits.find(d => d.txnid === razorpay_order_id);
  if (!deposit || deposit.userId !== userId) {
    return res.status(400).json({ error: "Invalid order or unauthorized" });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'JzMLJVJq4dSscjisHqIB39DJ';
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    const user = users.find(u => u.id === deposit.userId);
    if (user) {
      user.balance += deposit.amount;
      transactions.push({
        id: `txn_${Math.random().toString(36).substr(2)}`,
        userId: user.id,
        type: "deposit",
        amount: deposit.amount,
        balanceAfter: user.balance,
        description: `Razorpay Deposit (Order: ${razorpay_order_id})`,
        createdAt: new Date().toISOString()
      });
    }
    
    pendingDeposits = pendingDeposits.filter(d => d.txnid !== razorpay_order_id);
    
    // Send back the updated user balance
    res.json({ success: true, balance: user?.balance || 0 });
  } else {
    res.status(400).json({ error: "Signature mismatch!" });
  }
});

app.post("/api/wallet/deposit-failed", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { reason, orderId, amount } = req.body;
  
  transactions.push({
    id: `txn_${Math.random().toString(36).substr(2)}`,
    userId: user.id,
    type: "deposit_failed",
    amount: 0, // Doesn't affect balance
    balanceAfter: user.balance,
    description: `Failed Deposit: ${reason || 'Unknown error'} (Attempted ₹${amount || 0})`,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true });
});

app.post("/api/wallet/withdraw", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { amount, method, details } = req.body;
  if (!amount || amount <= 0 || amount > user.balance) {
    return res.status(400).json({ error: "Invalid amount or insufficient funds" });
  }

  // Deduct immediately, status would be pending in a real DB for manual processing
  user.balance -= Number(amount);
  
  const withdrawal: WithdrawalRequest = {
    id: `wdr_${Math.random().toString(36).substr(2)}`,
    userId: user.id,
    amount: Number(amount),
    status: 'pending',
    method,
    paymentDetails: details,
    createdAt: new Date().toISOString(),
  };
  withdrawals.push(withdrawal);

  transactions.push({
    id: `txn_${Math.random().toString(36).substr(2)}`,
    userId: user.id,
    type: "withdrawal",
    amount: -Number(amount),
    balanceAfter: user.balance,
    description: `Withdrawal Request: ${method}`,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, balance: user.balance, status: 'pending' });
});

app.get("/api/listings", (req, res) => {
  const activeListings = listings.filter(l => l.status === "active");
  res.json(activeListings);
});

app.get("/api/listings/:id", (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (listing) res.json(listing);
  else res.status(404).json({ error: "Not found" });
});

// Create listing API
app.post("/api/listings", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { title, description, price, level, rp, skins, popularity } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newListing: Listing = {
    id: `lst_${Math.random().toString(36).substr(2, 9)}`,
    sellerId: userId,
    title,
    description,
    price: Number(price),
    level: Number(level),
    rp,
    skins: Number(skins),
    popularity: Number(popularity),
    status: "active",
    createdAt: new Date().toISOString(),
    sellerRating: user.rating,
    sellerTrades: user.tradesCompleted,
    sellerName: user.name,
  };
  listings.push(newListing);
  res.json(newListing);
});

// Delete listing API
app.delete("/api/listings/:id", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = users.find(u => u.id === userId);
  const listingIndex = listings.findIndex(l => l.id === req.params.id);
  if (listingIndex === -1) return res.status(404).json({ error: "Not found" });
  
  if (listings[listingIndex].sellerId !== userId && user?.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (listings[listingIndex].status !== 'active') return res.status(400).json({ error: "Cannot delete inactive listing" });

  listings.splice(listingIndex, 1);
  res.json({ success: true });
});

// Fetch all trades (admin only)
app.get("/api/admin/trades", (req, res) => {
  const userId = getUserId(req);
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  res.json(trades);
});

// Fetch all users (admin only)
app.get("/api/admin/users", (req, res) => {
  const userId = getUserId(req);
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  // Exclude passwords
  res.json(users.map(u => {
    const { password, ...safeUser } = u as any;
    return safeUser;
  }));
});

// Fetch all withdrawals (admin only)
app.get("/api/admin/withdrawals", (req, res) => {
  const userId = getUserId(req);
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  const populated = withdrawals.map(w => {
    const wUser = users.find(u => u.id === w.userId);
    return { ...w, user: wUser ? { name: wUser.name, email: wUser.email, userCode: wUser.userCode } : null };
  });
  
  res.json(populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.post("/api/admin/withdrawals/:id/status", (req, res) => {
  const userId = getUserId(req);
  const admin = users.find(u => u.id === userId);
  if (!admin || admin.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  const w = withdrawals.find(w => w.id === req.params.id);
  if (!w || w.status !== 'pending') return res.status(400).json({ error: "Invalid withdrawal" });

  const { status } = req.body;
  if (status === 'rejected') {
    const targetUser = users.find(u => u.id === w.userId);
    if (targetUser) {
      targetUser.balance += w.amount;
      transactions.push({
        id: `txn_${Math.random().toString(36).substr(2)}`,
        userId: targetUser.id,
        type: "deposit", // Reversing withdrawal
        amount: w.amount,
        balanceAfter: targetUser.balance,
        description: `Refund for rejected withdrawal`,
        createdAt: new Date().toISOString()
      });
    }
  }
  w.status = status;
  res.json(w);
});

// Fetch admin stats
app.get("/api/admin/stats", (req, res) => {
  const userId = getUserId(req);
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  const totalListings = listings.length;
  const completedTrades = trades.filter(t => t.status === 'completed');
  const itemsSold = completedTrades.length;
  
  // Volume is the base listing price of all completed trades
  const transactionVolume = completedTrades.reduce((sum, t) => sum + t.price, 0);
  
  // Total profit is 16% (8% from buyer fee + 8% from seller deduction)
  const companyProfit = Math.round(transactionVolume * 0.16);

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && (!t.description || !t.description.toLowerCase().includes('reject'))).reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalListings,
    itemsSold,
    transactionVolume,
    companyProfit,
    totalDeposits,
    totalWithdrawals
  });
});

// Escrow transaction -> Start Trade
app.post("/api/trades", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { listingId } = req.body;
  const listing = listings.find((l) => l.id === listingId);
  const buyer = users.find((u) => u.id === userId);

  if (!listing || !buyer) return res.status(400).json({ error: "Invalid data" });
  if (listing.sellerId === buyer.id) return res.status(400).json({ error: "Cannot buy your own listing" });
  if (listing.status !== "active") return res.status(400).json({ error: "Listing unavailable" });
  
  const buyerTotal = Math.round(listing.price * 1.08); // 8% fee
  if (buyer.balance < buyerTotal) return res.status(400).json({ error: `Insufficient balance. Need ₹${buyerTotal} (includes 8% escrow fee)` });

  // Escrow Lock: Deduct from buyer immediately
  buyer.balance -= buyerTotal;
  listing.status = "in_trade";

  transactions.push({
    id: `txn_${Math.random().toString(36).substr(2)}`,
    userId: buyer.id,
    type: "p2p_buy",
    amount: -buyerTotal,
    balanceAfter: buyer.balance,
    description: `Escrow lock for P2P Buy (Base: ₹${listing.price} + Fee: ₹${buyerTotal - listing.price}) - Trade ID: ${listingId}`,
    tradeId: `trd_${listingId}`,
    createdAt: new Date().toISOString()
  });

  const trade: Trade = {
    id: `trd_${Math.random().toString(36).substr(2, 9)}`,
    listingId,
    buyerId: buyer.id,
    sellerId: listing.sellerId,
    price: listing.price,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  trades.push(trade);

  // System message
  const msg: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    tradeId: trade.id,
    senderId: "system",
    text: `Trade started. Escrow holds ${listing.price} INR safely. Waiting for seller to provide credentials.`,
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);

  res.json(trade);
});

app.get("/api/trades", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const userTrades = trades.filter(t => t.buyerId === userId || t.sellerId === userId);
  res.json(userTrades);
});

app.get("/api/trades/:id", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = users.find(u => u.id === userId);
  const trade = trades.find((t) => t.id === req.params.id);
  if (trade && (trade.buyerId === userId || trade.sellerId === userId || user?.role === 'admin')) {
    res.json(trade);
  } else {
    res.status(404).json({ error: "Not found or unauthorized" });
  }
});

app.get("/api/messages/:tradeId", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = users.find(u => u.id === userId);
  const trade = trades.find((t) => t.id === req.params.tradeId);
  if (!trade || (trade.buyerId !== userId && trade.sellerId !== userId && user?.role !== 'admin')) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json(messages.filter((m) => m.tradeId === req.params.tradeId));
});

// Update Trade Status
app.post("/api/trades/:id/status", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { status, reason } = req.body as { status: TradeStatus; reason?: string };
  const trade = trades.find((t) => t.id === req.params.id);
  if (!trade) return res.status(404).json({ error: "Trade not found" });

  // Allow admin to update any trade, otherwise verify affiliation
  const user = users.find(u => u.id === userId);
  if (user?.role !== 'admin' && trade.buyerId !== userId && trade.sellerId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  trade.status = status;
  trade.updatedAt = new Date().toISOString();

  let text = "";
  if (status === "credentials_sent") text = "Seller has provided login credentials. Buyer, please verify account access and details. DO NOT SHARE OTP unless completely verified.";
  
  if (status === "completed") {
    const sellerPayout = Math.round(trade.price * 0.92); // 8% fee deducted
    text = `Trade Complete! Escrow released ₹${sellerPayout} to seller (8% platform fee applied).`;
    const seller = users.find(u => u.id === trade.sellerId);
    if (seller) {
      seller.balance += sellerPayout;
      seller.tradesCompleted += 1;
      transactions.push({
        id: `txn_${Math.random().toString(36).substr(2)}`,
        userId: seller.id,
        type: "p2p_sell",
        amount: sellerPayout,
        balanceAfter: seller.balance,
        description: `Escrow release for P2P Sell (Base: ₹${trade.price} - Fee: ₹${trade.price - sellerPayout}) - Trade ID: ${trade.id}`,
        tradeId: trade.id,
        createdAt: new Date().toISOString()
      });
    }
    const buyer = users.find(u => u.id === trade.buyerId);
    if (buyer) buyer.tradesCompleted += 1;

    const listing = listings.find(l => l.id === trade.listingId);
    if (listing) listing.status = "sold";
  }
  
  if (status === "cancelled") {
    const buyerRefund = Math.round(trade.price * 1.08); // Refund full amount including fee
    const buyer = users.find(u => u.id === trade.buyerId);
    if (buyer) {
      buyer.balance += buyerRefund; // Refund
      transactions.push({
        id: `txn_${Math.random().toString(36).substr(2)}`,
        userId: buyer.id,
        type: "p2p_buy", // Reversing buy
        amount: buyerRefund,
        balanceAfter: buyer.balance,
        description: `Refund for Cancelled Trade: ${trade.id}`,
        tradeId: trade.id,
        createdAt: new Date().toISOString()
      });
    }
    
    // Mark listing as active again
    const listing = listings.find(l => l.id === trade.listingId);
    if (listing) listing.status = "active";
    
    text = `Trade Cancelled. Escrow refunded ₹${buyerRefund} to buyer. Reason: ${reason || 'Mutual agreement'}`;
  }

  if (status === "disputed") {
    text = `🚨 Appeal Raised! The trade is now under dispute. Customer Support (Admin) has joined the chat to resolve the issue. Reason: ${reason || 'Issue with account access or details'}`;
  }

  if (text) {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      tradeId: trade.id,
      senderId: "system",
      text,
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);
  }

  res.json(trade);
});

// MOCK ENDPOINT TO SUBMIT CREDENTIALS
app.post("/api/trades/:id/credentials", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const trade = trades.find((t) => t.id === req.params.id);
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  
  if (trade.sellerId !== userId) return res.status(403).json({ error: "Only seller can submit credentials" });

  const { loginId, password } = req.body;

  if (trade.status === "pending") {
    trade.status = "credentials_sent";
    trade.credentials = { loginId, password };
    trade.updatedAt = new Date().toISOString();
    
    // Add generic "credentials submitted" message for buyer/admin
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      tradeId: trade.id,
      senderId: "system",
      text: "Seller has securely provided the login credentials. Buyer can now test the account.",
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);

  }
  res.json({ success: true });
});

// Reviews API
app.post("/api/reviews", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { tradeId, revieweeId, rating, comment } = req.body;
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade || trade.status !== "completed") {
    return res.status(400).json({ error: "Trade must be completed to review" });
  }

  const existingReview = reviews.find(r => r.tradeId === tradeId && r.reviewerId === userId);
  if (existingReview) {
    return res.status(400).json({ error: "You have already reviewed this trade" });
  }

  const review: Review = {
    id: `rev_${Math.random().toString(36).substr(2)}`,
    tradeId,
    reviewerId: userId,
    revieweeId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);

  // Update user's rating
  const reviewee = users.find(u => u.id === revieweeId);
  if (reviewee) {
    const userReviews = reviews.filter(r => r.revieweeId === revieweeId);
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    reviewee.rating = Number((sum / userReviews.length).toFixed(1));
  }

  res.json(review);
});

// Stats API
app.get("/api/stats", (req, res) => {
  const activeSellers = Array.from(new Set(listings.filter(l => l.status === "active").map(l => l.sellerId))).length;
  const premiumIds = listings.filter(l => l.status === "active").length;
  // Real active users connected right now based on active sessions
  const liveBuyers = sessions.size;
  res.json({ liveBuyers, activeSellers, premiumIds });
});

// Serve Vite App for Development and Production
async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
