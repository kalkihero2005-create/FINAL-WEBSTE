import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { User, Listing, Trade, ChatMessage, TradeStatus } from "./src/types";

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE MOCK
let users: any[] = [
  {
    id: "user1",
    name: "Alex Gamer",
    email: "alex@example.com",
    password: "password123",
    balance: 50000,
    verified: true,
    tradesCompleted: 42,
    rating: 4.8,
    joinDate: "2023-01-15T00:00:00Z",
  },
  {
    id: "user2",
    name: "ProSeller_IN",
    email: "pro@example.com",
    password: "password123",
    balance: 15000,
    verified: true,
    tradesCompleted: 156,
    rating: 4.9,
    joinDate: "2022-05-10T00:00:00Z",
  },
];

let listings: Listing[] = [
  {
    id: "lst1",
    sellerId: "user2",
    title: "M416 Glacier Max + 3 X-Suits",
    description: "Selling my main account. Season 2 Conqueror frame, all mythics from season 10.",
    price: 35000,
    level: 78,
    rp: "Maxed S10-S20",
    skins: 145,
    popularity: 1200000,
    status: "active",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sellerRating: 4.9,
    sellerTrades: 156,
    sellerName: "ProSeller_IN",
  },
  {
    id: "lst2",
    sellerId: "user2",
    title: "Conqueror S5 + M4 Fool Lv5",
    description: "Good secondary account. Need urgent money.",
    price: 12000,
    level: 65,
    rp: "Maxed S15+",
    skins: 85,
    popularity: 450000,
    status: "active",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    sellerRating: 4.9,
    sellerTrades: 156,
    sellerName: "ProSeller_IN",
  },
];

let trades: Trade[] = [];
let messages: ChatMessage[] = [];

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
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const newUser = {
    id: `usr_${Math.random().toString(36).substr(2)}`,
    name,
    email,
    password,
    balance: 0,
    verified: false,
    tradesCompleted: 0,
    rating: 5.0,
    joinDate: new Date().toISOString()
  };
  users.push(newUser);
  const token = `tok_${Math.random().toString(36).substr(2)}`;
  sessions.set(token, newUser.id);
  res.json({ token, user: newUser });
});

app.post("/api/login", (req, res) => {
  const { email, loginId, password } = req.body;
  const loginEmail = email || loginId;
  
  if (loginEmail === "kalki" && password === "Singh2005@") {
    let adminUser = users.find(u => u.id === "admin1");
    if (!adminUser) {
      adminUser = {
        id: "admin1",
        name: "System Admin",
        email: "kalki",
        password: "Singh2005@",
        balance: 9999999,
        verified: true,
        tradesCompleted: 999,
        rating: 5.0,
        joinDate: "2023-01-01T00:00:00Z",
        role: "admin"
      };
      users.push(adminUser);
    }
    
    const token = `tok_admin_${Math.random().toString(36).substr(2)}`;
    sessions.set(token, adminUser.id);
    return res.json({ token, user: adminUser });
  }

  const user = users.find(u => u.email === loginEmail && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
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
app.post("/api/wallet/deposit", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { amount, utrNumber } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  // Mock auto verification
  user.balance += Number(amount);
  res.json({ success: true, balance: user.balance });
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

  res.json({
    totalListings,
    itemsSold,
    transactionVolume,
    companyProfit
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
    }
    const buyer = users.find(u => u.id === trade.buyerId);
    if (buyer) buyer.tradesCompleted += 1;

    const listing = listings.find(l => l.id === trade.listingId);
    if (listing) listing.status = "sold";
  }
  
  if (status === "cancelled") {
    const buyerRefund = Math.round(trade.price * 1.08); // Refund full amount including fee
    const buyer = users.find(u => u.id === trade.buyerId);
    if (buyer) buyer.balance += buyerRefund; // Refund
    
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

// MOCK ENDPOINT TO SIMULATE SELLER SENDING CREDENTIALS
app.post("/api/trades/:id/simulate-seller", (req, res) => {
  const trade = trades.find((t) => t.id === req.params.id);
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  
  if (trade.status === "pending") {
    setTimeout(() => {
      trade.status = "credentials_sent";
      trade.updatedAt = new Date().toISOString();
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        tradeId: trade.id,
        senderId: trade.sellerId,
        text: "Credentials:\nLogin: bgmi_pro_99@gmail.com\nPass: Secure#Pass123\nTwitter: twit_pro_99",
        timestamp: new Date().toISOString(),
      };
      messages.push(msg);
      
      const sysMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        tradeId: trade.id,
        senderId: "system",
        text: "Seller provided credentials. Please verify and confirm within 24h.",
        timestamp: new Date().toISOString(),
      };
      messages.push(sysMsg);
    }, 2000);
  }
  res.json({ success: true });
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
