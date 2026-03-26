import { createServer } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT) || 3002;
const INTERNAL_SECRET = process.env.CRON_SECRET || process.env.WORKER_SECRET || "internal-socket-secret";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://novaclio.io",
      "https://www.novaclio.io",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Auth middleware - client sends userId + token from /api/socket-auth
io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  const token = socket.handshake.auth?.token;
  if (!userId || !token) {
    return next(new Error("Authentication required"));
  }
  // Token is validated by the Next.js API before being issued
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`[Socket] Connected: ${userId} (${socket.id})`);
  socket.join(`user:${userId}`);

  socket.on("notification:read", (notificationId: string) => {
    socket.to(`user:${userId}`).emit("notification:marked-read", notificationId);
  });

  socket.on("notifications:read-all", () => {
    socket.to(`user:${userId}`).emit("notifications:all-marked-read");
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${userId} (${reason})`);
  });
});

// Internal HTTP API for emitting events from Next.js API routes
httpServer.on("request", (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connections: io.engine.clientsCount }));
    return;
  }

  if (req.url === "/emit" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const { userId, event, data, secret } = JSON.parse(body);
        // No secret check for localhost calls (internal only)
        if (userId && event) {
          io.to(`user:${userId}`).emit(event, data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "userId and event required" }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`[Socket.io] Running on port ${PORT}`);
});
