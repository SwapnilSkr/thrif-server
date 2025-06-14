import express from "express";
const homeRouter = express.Router();
import { filterHome, likePost, filterCount, defaultHome } from "../controllers/shop/homeCon.js";
import verifyUser from "../middleware/rbac.js";
homeRouter.use(verifyUser());

homeRouter.get("/defaultHome", defaultHome)
homeRouter.post("/filter", filterHome)
homeRouter.post("/likePost", likePost)
homeRouter.post("/filterCount", filterCount)

export default homeRouter;