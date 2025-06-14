import express from "express";
const adminRouter = express.Router();
import { login, emailSendOtp, verifyEmailOTP, setPassword } from "../controllers/admin/auth.js";
import { getUserList, updateUserProfile, getSellerList, updateSellerProfile, getSellerProfile, ticketList, deleteUser } from "../controllers/admin/user.js";
import { fetchPost, postUpdate, fetchProduct, productUpdate, productDelete, postDelete, approvalList } from "../controllers/admin/product.js";
import { orderStatusUpdate, sellerTransactionList, withdrawalUpdated, orderList } from "../controllers/admin/order.js";
import { addEditBanner, getBanner, deleteBanner, addEditType, deleteType } from "../controllers/admin/style.js";

import verifyUser from "../middleware/rbac.js";

adminRouter.post("/login", login);
adminRouter.post("/emailSendOtp", emailSendOtp);
adminRouter.post("/verifyEmailOTP", verifyEmailOTP);
adminRouter.post("/setPassword", setPassword);

//ORDER
adminRouter.put("/orderStatusUpdate", orderStatusUpdate);
adminRouter.get("/orderList", orderList);
adminRouter.use(verifyUser());

// User
adminRouter.get("/getUserList", getUserList);
adminRouter.post("/updateUserProfile", updateUserProfile);
adminRouter.delete("/deleteUser/:userId", deleteUser)

// Seller
adminRouter.get("/getSellerList", getSellerList);
adminRouter.post("/updateSellerProfile", updateSellerProfile);
adminRouter.get("/getSellerProfile/:userId", getSellerProfile);

//POST
adminRouter.get("/postList", fetchPost);
adminRouter.put("/postUpdate", postUpdate);
adminRouter.delete("/postdelete/:id", postDelete);

//PRODUCT
adminRouter.get("/productList", fetchProduct);
adminRouter.put("/productUpdate", productUpdate);
adminRouter.delete("/productdelete/:id", productDelete);

// Withdrawal
adminRouter.get("/withdrawalList", sellerTransactionList);
adminRouter.put("/withdrawalRequestApprove", withdrawalUpdated);

// Ticket
adminRouter.get("/ticketList", ticketList);

//APPROVAL
adminRouter.get("/approvalList", approvalList);

// Banner
adminRouter.get("/getBanner", getBanner);
adminRouter.post("/addEditBanner", addEditBanner);
adminRouter.delete("/deleteBanner/:id", deleteBanner);

// Types
adminRouter.post("/addEditTypes/:type", addEditType);
adminRouter.delete("/deleteTypes/:type/:id", deleteType);

export default adminRouter;
