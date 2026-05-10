const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.SOCKET_PORT || 3003;
const NEXT_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://novaclio.io";
const INTERNAL_URL = process.env.SOCKET_INTERNAL_URL || "http://127.0.0.1:3001";

const httpServer = http.createServer((req, res) => {
  // Internal API for server-side emit (called by Next.js API routes)
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { room, event, data } = JSON.parse(body);
        if (room && event) {
          io.to(room).emit(event, data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "room and event required" }));
        }
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Novaclio WebSocket Server v2");
});

const io = new Server(httpServer, {
  cors: {
    origin: [NEXT_URL, INTERNAL_URL, "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

// Auth middleware - validate token via Next.js API
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No auth token"));
  
  try {
    // Validate session token against Next.js
    const resp = await fetch(INTERNAL_URL + "/api/socket-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!resp.ok) return next(new Error("Invalid token"));
    const user = await resp.json();
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userName = user.name || "User";
    next();
  } catch (e) {
    next(new Error("Auth failed: " + e.message));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log("[WS] Connected:", userId, socket.id);

  // Track online status
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  // Auto-join user's personal room for notifications
  socket.join("user:" + userId);

  // === NOTIFICATION EVENTS (preserved from v1) ===
  
  socket.on("notification:read", (data) => {
    // Mark single notification as read
    socket.to("user:" + userId).emit("notification:marked-read", data);
  });

  socket.on("notifications:read-all", () => {
    socket.to("user:" + userId).emit("notifications:all-marked-read");
  });

  // === MESSAGING EVENTS (new in v2) ===

  // Join a conversation room
  socket.on("conversation:join", (conversationId) => {
    socket.join("conv:" + conversationId);
    console.log("[WS] User", userId, "joined conv:", conversationId);
  });

  // Leave a conversation room
  socket.on("conversation:leave", (conversationId) => {
    socket.leave("conv:" + conversationId);
  });

  // Send a message - broadcast to conversation room
  socket.on("message:send", (data) => {
    // data: { conversationId, message (the saved message object from API) }
    const { conversationId, message } = data;
    if (!conversationId || !message) return;
    
    // Broadcast to everyone in the conversation EXCEPT sender
    socket.to("conv:" + conversationId).emit("message:new", {
      conversationId,
      message,
    });
    
    // Also notify the other user(s) who may not have the conversation open
    // They'll get this as an unread indicator
    if (message.receiverId) {
      socket.to("user:" + message.receiverId).emit("message:unread", {
        conversationId,
        senderId: userId,
        senderName: socket.userName,
        preview: (message.body || "").substring(0, 80),
      });
    }
  });

  // Typing indicator
  socket.on("message:typing", (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    socket.to("conv:" + conversationId).emit("message:typing", {
      conversationId,
      userId,
      userName: socket.userName,
    });
  });

  // Stop typing
  socket.on("message:stop-typing", (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    socket.to("conv:" + conversationId).emit("message:stop-typing", {
      conversationId,
      userId,
    });
  });

  // Messages read receipt
  socket.on("message:read", (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    socket.to("conv:" + conversationId).emit("message:read", {
      conversationId,
      userId,
    });
  });

  // === PRESENCE EVENTS ===
  
  socket.on("presence:check", (targetUserId) => {
    const isOnline = onlineUsers.has(targetUserId) && onlineUsers.get(targetUserId).size > 0;
    socket.emit("presence:status", { userId: targetUserId, online: isOnline });
  });

  // === DISCONNECT ===

  socket.on("disconnect", (reason) => {
    console.log("[WS] Disconnected:", userId, reason);
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log("[WS] Novaclio Socket Server v2 running on port " + PORT);
});
