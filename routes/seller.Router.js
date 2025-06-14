import express from "express";
const sellerRouter = express.Router();
import { register, verifyAadharOTP, getProfile,followUnfollowSeller,sellingAnalytics,addWithdrwalRequest,wallet,getDemographicsOverview } from "../controllers/shop/sellerCon.js";
import verifyUser from "../middleware/rbac.js"
sellerRouter.use(verifyUser());

sellerRouter.post("/register", register);
sellerRouter.post("/verifyAadharCard", verifyAadharOTP);
sellerRouter.get("/profile", getProfile);
sellerRouter.post("/followUnfollow", followUnfollowSeller);
sellerRouter.post("/addWithdrwalRequest", addWithdrwalRequest);
sellerRouter.get("/wallet", wallet);
sellerRouter.get("/sellingAnalytics", sellingAnalytics);
sellerRouter.get("/getDemographicsOverview",getDemographicsOverview);
export default sellerRouter;