const express = require("express");

const http = require("http");

require("dotenv").config();

const morgan = require("morgan");

const productRoutes = require("./routes/products");

const categoryRoutes = require("./routes/category");

const cartRoutes = require("./routes/cart");

const userRoutes = require("./routes/users");

const customerRoutes = require("./routes/customer");

const orderRoutes = require("./routes/orders");

const analyticsRoutes = require("./routes/analytics");

const storeRoutes = require("./routes/store");

const publicStore = require("./routes/publicStore");

const mongoose = require("mongoose");

const cors = require("cors");

const cookieParser = require("cookie-parser");

const authMiddleware = require("./middlewares/authMiddleware");
const resolveSlugMiddleware = require("./middlewares/resolveSlugMiddleware");

const logger = require("./helpers/logger");

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION 💥", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION 💥", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
const app = express();

app.use(express.static("public"));

app.use(
  cors({
    origin: [process.env.ORIGIN, process.env.SEC_ORIGIN].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Idempotency-Key",
      "idempotency-key",
    ],
  })
);

// app.use(
//   cors({
//     // origin: "http://localhost:5173",
//     origin: process.env.ORIGIN,
//     credentials: true,
//   })
// );

const httpServer = http.createServer(app);

const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL).then(() => {
  console.log("connected to db");
  const { initSocket } = require("./services/socketService");
  initSocket(httpServer);
  httpServer.listen(process.env.PORT, () => {
    console.log("server is running on port " + process.env.PORT);
  });
});

app.use(express.json());

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);

app.use(morganMiddleware);

// app.use(morgan("dev"));

app.use(cookieParser());

app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  return res.json({ hello: "world" });
  // return res.render('email')
});

app.use("/api/stores/:storeId/products", authMiddleware, productRoutes);

app.use("/api/stores/:storeId/categories", authMiddleware, categoryRoutes);

app.use("/api/stores/:storeId/cart", authMiddleware, cartRoutes);

app.use("/api/stores/:storeId/customers", authMiddleware, customerRoutes);

app.use("/api/stores/:storeId/orders", authMiddleware, orderRoutes);

app.use("/api/stores/:storeId/analytics", authMiddleware, analyticsRoutes);

app.use("/api/stores/:storeSlug", publicStore);

app.use("/api/stores", authMiddleware, storeRoutes);

app.use("/api/users", userRoutes);

app.use(
  "/api/public/stores/:storeSlug/categories",
  resolveSlugMiddleware,
  categoryRoutes
);

app.use(
  "/api/public/stores/:storeSlug/products",
  resolveSlugMiddleware,
  productRoutes
);

app.use(
  "/api/public/stores/:storeSlug/cart",
  resolveSlugMiddleware,
  cartRoutes
);

app.use(
  "/api/public/stores/:storeSlug/orders",
  resolveSlugMiddleware,
  orderRoutes
);
