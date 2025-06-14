import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { multerErrHandler } from "./middleware/multer.js";
import { getLocaleMessages  } from "./helpers/helper.js";
import swaggerUi from "swagger-ui-express";
import { readFile } from "fs/promises";
import userRouter from "./routes/userRoute.js";
import masterRouter from "./routes/masterAPI.js";
import sellerRouter from "./routes/seller.Router.js"
import productRouter from "./routes/product.router.js"
import searchRouter from "./routes/searchRouter.js"
import adminRouter from "./routes/adminRouter.js";
import upload from "./routes/uploadS3.js";
import paymentRouter from "./routes/paymentRouter.js";

// import swaggerOutput from "./swaggerOutput.json";
const swaggerOutput = JSON.parse(
  await readFile(new URL("./swaggerOutput.json", import.meta.url))
);
dotenv.config();
const app = express();

app.use(morgan("combined"));
app.use(multerErrHandler);
app.use(express.static("uploads"));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  try {
    res.status(200).json({ id: 1, message: "Thrif Backend has started" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));

import { fileURLToPath } from "url";
import path from "path";
import homeRouter from "./routes/homeRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.__basedir = __dirname + "/";
global.locals = getLocaleMessages();

// Routes
app.use("/auth", userRouter);
app.use("/admin", adminRouter);
app.use("/master", masterRouter);
app.use("/seller", sellerRouter);
app.use("/seller/product", productRouter);
app.use("/product", productRouter);
app.use("/home", homeRouter);
app.use("/search", searchRouter);
app.use("/user", userRouter);
app.use("/images", upload);
app.use("/payment",paymentRouter);
app.use("/order",paymentRouter);

export default app;
