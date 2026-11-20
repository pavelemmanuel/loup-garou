/**
 * Zero-Internet Local Wi-Fi / Hotspot WebSocket Relay for Les Loups-Garous de Thiercelieux.
 * Run with: `npm run lan-server` (listens on 0.0.0.0:4567 so any iOS/Android/Web device on the same Wi-Fi or Hotspot can join).
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4567;
const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'loup-garou-thiercelieux-lan-relay',
      port: PORT,
    })
  );
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const text = data.toString();
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(text);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[Loups-Garous de Thiercelieux LAN Relay] Listening on ws://0.0.0.0:${PORT}`
  );
});
