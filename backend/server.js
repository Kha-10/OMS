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

const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const authMiddleware = require("./middlewares/authMiddleware");
const resolveSlugMiddleware = require("./middlewares/resolveSlugMiddleware");
const sendEmail = require("./helpers/sendEmail");

const app = express();

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

app.use(express.static("public"));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.ORIGIN,
    ].filter(Boolean),
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

app.use(morgan("dev"));

app.use(morgan("dev"));

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

app.get("/cookie", (req, res) => {
  res.cookie("gg", "wp", { httpOnly: true });
  return res.send("ggwp");
});

app.get("/get-cookie", (req, res) => {
  let cookies = req.cookies;
  return res.send(cookies);
});

app.get("/send-email", async (req, res) => {
  try {
    await sendEmail({
      viewFilename: "email",
      data: {
        name: "KHA",
      },
      from: "Emerald@gmail.com",
      to: "kha@gmail.com",
    });
    return res.status(200).send("email sent");
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

app.post("/upload", upload.single("photo"), function (req, res, next) {
  console.log(req.file);
  return res.status(200).send(req.file);
});
