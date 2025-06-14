import express from "express";
const searchRouter = express.Router();
import { getProductAndPostBySearch, } from "../controllers/shop/searchCon.js";
import verifyUser from "../middleware/rbac.js";
searchRouter.use(verifyUser());

searchRouter.get("/list", getProductAndPostBySearch);

export default searchRouter;