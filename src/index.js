import "dotenv/config";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import apiRouter from "./routers/api.js";

const PORT = 6080;

const app = express();
const logger = pino();
const httpLogger = pinoHttp({ logger });

app.use(httpLogger);
app.use(express.json());

// routing
app.use("/api/v1", apiRouter);

// starting the server
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
