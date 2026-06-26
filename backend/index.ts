import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";
import { env } from "./src/lib/env";
import authRouter from "./src/routes/auth";
import meRouter from "./src/routes/me";

const app = express();

// Allow any origin for now
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/me", meRouter);

// Express 5 forwards errors thrown in async handlers here.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
