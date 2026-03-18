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
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const cached = res.getHeader("X-Cache") || "-";
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} → ${status} (${duration}ms) cache:${cached}`,
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
