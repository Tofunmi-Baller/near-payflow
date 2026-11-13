import type { Express, Response } from "express";

interface SSEEvent {
  type: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount?: number;
  token?: string;
  timestamp: string;
}

const sseClients = new Set<Response>();

export function broadcast(event: SSEEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    res.write(data);
  }
}

export function setupSSE(app: Express) {
  app.get("/api/events", (_req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    res.write("data: {\"type\":\"connected\"}\n\n");

    sseClients.add(res);

    const keepalive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    res.on("close", () => {
      clearInterval(keepalive);
      sseClients.delete(res);
    });
  });
}
