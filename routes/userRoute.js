import express from "express";
import multer from "multer";
import {
    emailSendOtp, verifyEmailOTP, saveBirthday, usernameCheck, updateUserSignupDetails,uploadProfilePicture, updateUserDisplayDetails, getAccessTokenByFbToken, checkUserExist,
    emailSendOTPForLogin, verifyEmailOTPForLogin, getAccessTokenByPhone, updateUserOtherDetails, checkPhoneNumber, deleteUserAccount,
    getUserById, getUser, blockSeller, saveDeviceToken, getProfile, notificationList, notificationRead, getUserByIds, 
    sendChatNotificationUser,getSellerById
} from "../controllers/auth.js";
import { updateProfile, ticketAdd, ticketList } from "../controllers/shop/settingCon.js";
import { updatePreference, addressAdd, addressList, addressEdit, addressRemove } from "../controllers/shop/settingCon.js";

import verifyUser from "../middleware/rbac.js";
import { getConversations, getMessages, sendMessage, createConversation } from '../controllers/chatController.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    },
});

const userRouter = express.Router();

// User signup
userRouter.post("/emailSendOtp", emailSendOtp);
userRouter.post("/verifyEmailOTP", verifyEmailOTP);
userRouter.post("/usernameCheck", usernameCheck);
userRouter.post("/saveUserSignupDetails", updateUserSignupDetails);
userRouter.post("/saveDisplayDetails", updateUserDisplayDetails);
userRouter.post("/saveBirthday", saveBirthday);
userRouter.post("/uploadProfilePicture", upload.single('profilePicture'), uploadProfilePicture);
userRouter.post("/getAccessTokenByFbToken", getAccessTokenByFbToken);
userRouter.post("/getAccessTokenByPhone", getAccessTokenByPhone);
userRouter.post("/phoneNumberCheck", checkPhoneNumber);
userRouter.post("/sendOtpForLogin", emailSendOTPForLogin);
userRouter.post("/verifyOtpForLogin", verifyEmailOTPForLogin);
userRouter.post("/checkUserExist", checkUserExist);
userRouter.delete("/deleteUserAccount", deleteUserAccount);
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
