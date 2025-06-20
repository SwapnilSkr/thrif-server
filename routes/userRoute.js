import express from "express";
import {
    emailSendOtp, verifyEmailOTP, usernameCheck, updateUserSignupDetails, getAccessTokenByFbToken, checkUserExist,
    emailSendOTPForLogin, verifyEmailOTPForLogin, getAccessTokenByPhone, updateUserOtherDetails, checkPhoneNumber, deleteUserAccount,
    getUserById, getUser, blockSeller, saveDeviceToken, getProfile, notificationList, notificationRead, getUserByIds, 
    sendChatNotificationUser,getSellerById
} from "../controllers/auth.js";
import { updateProfile, ticketAdd, ticketList } from "../controllers/shop/settingCon.js";
import { updatePreference, addressAdd, addressList, addressEdit, addressRemove } from "../controllers/shop/settingCon.js";

import verifyUser from "../middleware/rbac.js";
import { getConversations, getMessages, sendMessage, createConversation } from '../controllers/chatController.js';

const userRouter = express.Router();

// User signup
userRouter.post("/emailSendOtp", emailSendOtp);
userRouter.post("/verifyEmailOTP", verifyEmailOTP);
userRouter.post("/usernameCheck", usernameCheck);
userRouter.post("/saveUserSignupDetails", updateUserSignupDetails);
userRouter.post("/getAccessTokenByFbToken", getAccessTokenByFbToken);
userRouter.post("/phoneNumberCheck", checkPhoneNumber);

// User login
userRouter.post("/sendOtpForLogin", emailSendOTPForLogin);
userRouter.post("/verifyOtpForLogin", verifyEmailOTPForLogin);
// userRouter.post("/getAccessTokenByPhone", getAccessTokenByPhone);
userRouter.post("/checkUserExist", checkUserExist);
userRouter.delete("/deleteUserAccount", deleteUserAccount);

// This route verifies all authenticated users
userRouter.use(verifyUser());

//User Onbording
userRouter.put("/setNotificationStatusAndIntereset", updateUserOtherDetails);

// Profiles
userRouter.get("/getSellerById/:id", getSellerById);
userRouter.get("/getBuyerById/:id", getUserById);
userRouter.get("/getSellerProfile", getUser);
userRouter.get("/profile", getProfile);

userRouter.post("/blockSellerProfile", blockSeller);

// userRouter.get("/reportSellerProfile", getUser);
userRouter.put("/updateProfile", updateProfile);
userRouter.post("/saveDeviceToken", saveDeviceToken);
userRouter.put("/updatePreference", updatePreference);

//Address
userRouter.post("/addressAdd", addressAdd);
userRouter.get("/addressList", addressList);
userRouter.post("/addressEdit", addressEdit);
userRouter.delete("/addressRemove/:id", addressRemove);

//Notification
userRouter.get("/notificationList", notificationList);
userRouter.put("/notificationRead", notificationRead);

userRouter.post("/getUserByIds", getUserByIds);
userRouter.post("/sendChatNotification", sendChatNotificationUser);

//Resolution Center 
userRouter.post("/ticketAdd", ticketAdd);
userRouter.get("/ticketList", ticketList);

// Chat/Message endpoints
userRouter.get('/conversations', getConversations);
userRouter.post('/conversations', createConversation);
userRouter.get('/conversations/:conversationId/messages', getMessages);
userRouter.post('/conversations/:conversationId/messages', sendMessage);

export default userRouter;
