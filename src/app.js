import crypto from "crypto";
import express from "express";
import cors from "cors";
import compression from "compression";
import env from "./config/env.js";
import routes from "./routes/index.js";
import {
  notFoundMiddleware,
  errorMiddleware,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin:
      env.corsOrigin === "*"
        ? true
        : env.corsOrigin.split(",").map((o) => o.trim()),
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));

// Fallback body parser for Lambda: serverless-http@3 + Express 5
// Express 5's body parser skips the custom stream created by serverless-http,
// so we manually parse the body from the API Gateway event.
app.use((req, res, next) => {
  if (req.body === undefined && req.apiGateway?.event?.body) {
    const { body, isBase64Encoded } = req.apiGateway.event;
    const raw = isBase64Encoded
      ? Buffer.from(body, "base64").toString("utf8")
      : body;
    const ct = (req.headers["content-type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      try { req.body = JSON.parse(raw); } catch { /* leave undefined */ }
    }
  }
  next();
});

// Request ID + request logger
app.use((req, res, next) => {
  const requestId = req.headers["x-amzn-requestid"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const cached = res.getHeader("X-Cache") || "-";
    console.log(
      `[${new Date().toISOString()}] ${requestId} ${method} ${originalUrl} → ${status} (${duration}ms) cache:${cached}`,
    );
  });

  next();
});
app.use("/api", routes);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
