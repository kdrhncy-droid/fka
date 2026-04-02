import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registerSocketHandlers } from "./server/socketHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => { console.error('[Server] Yakalanmayan hata:', err); });
process.on('unhandledRejection', (reason) => { console.error('[Server] Yakalanmayan Promise reddi:', reason); });

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => { res.sendFile(path.join(__dirname, "dist", "index.html")); });
app.get('/ping', (_req, res) => res.send('pong'));

io.on("connection", (socket) => {
  registerSocketHandlers(socket, io);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Render free tier keep-alive
if (process.env.NODE_ENV === 'production') {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try { await fetch(`${RENDER_URL}/ping`); } catch (_) {}
  }, 10 * 60 * 1000);
}
