import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFoundMiddleware, errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
  }),
);
app.use(express.json());
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
