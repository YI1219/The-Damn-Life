import { createServer } from "node:http";
import { URL } from "node:url";
import { WebSocketServer } from "ws";
import { handleHttp } from "./httpApi.js";
import { attachClientSocket } from "./wsConnection.js";

const httpServer = createServer(handleHttp);
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/ws") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    attachClientSocket(ws);
  });
});

const port = Number(process.env.HOST_PORT ?? "8787");
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`host listening on http://0.0.0.0:${port} (ws /ws)`);
});
