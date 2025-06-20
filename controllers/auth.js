import User from "../models/userModel.js";
import EmailVerificationModel from "../models/emailVerifyModel.js"
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import admin, { storage } from '../config/firebase.js';
import SellerModel from '../models/sellerModel.js';
import ProductModel from '../models/productModel.js';
import PostModel from '../models/postModel.js';
import UserTokenModel from '../models/userTokenModel.js';
import NotificationModel from "../models/notificationModel.js";
import mongoose from "mongoose";
import { sendChatNotification } from "../helpers/notification.js";
import Razorpay from "razorpay";
import orderProduct from "../models/orderProductModel.js";
import reviewsModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Helper function to generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const getUidFromToken = async (token) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
};

const emailSendOtp = async (req = Request, res = Response) => {
    try {
        const { email } = req.body;
        if (![email].every(Boolean)) {
            res.status(200).send({
                message: locals.enter_email,
                success: false,
                data: null
            });
            return
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        // Check if user exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(200).send({ message: locals.email_exists, success: false, data: null });
        }

        let userQuery = await EmailVerificationModel.findOne({ email });

        if (!userQuery) {
            await EmailVerificationModel.create({
                email,
                // email_otp: await bcrypt.hash(otp.toString(), 10)
                email_otp: 123456,
            });
        } else {
            await EmailVerificationModel.updateOne({ email }, {
                $set: {
                    // email_otp: await bcrypt.hash(otp.toString(), 10),
                    email_otp: 123456,
                    email_verified: false
                }
            });
        }
        return res.status(200).send({ message: locals.otp_send, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
};

const verifyEmailOTP = asyncHandler(async (req, res) => {
    try {
        const { otp, email } = req.body;
        if (![email, otp].every(Boolean)) {
            res.status(200).send({
                message: locals.email_otp_required,
                success: false,
                data: null
            });
        }

        console.log("[Email OTP Verify] Looking up email verification record...");
        const checkEmail = await EmailVerificationModel.findOne({ email });
        if (!checkEmail) {
            console.log("[Email OTP Verify] No email verification record found for:", email);
            return res.status(200).send({
                message: locals.invalid_email,
                success: false,
                data: null
            });
        }
        if (checkEmail.email_otp == otp) {
            await EmailVerificationModel.updateOne({ email }, {
                // email_otp: await bcrypt.hash(otp.toString(), 10),
                $set: {
                    email_otp: 0,
                    email_verified: true
                }
            });
            return res.status(200).send({ message: locals.otp_verify, success: true, data: null });
        }
        return res.status(200).send({ message: locals.valid_otp, success: false, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const usernameCheck = async (req = Request, res = Response) => {
    try {
        console.log("[Username Check] Request received:", {
            username: req.body.username,
            timestamp: new Date().toISOString()
        });

        const { username } = req.body;
        if (![username].every(Boolean)) {
            console.log("[Username Check] Missing username in request");
            res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
            return;
        }

        console.log("[Username Check] Checking if username exists:", username);
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log("[Username Check] Username already exists:", username);
            return res.status(200).send({ message: locals.username_exists, success: false, data: null });
        }

        console.log("[Username Check] Username is available:", username);
        return res.status(200).send({ message: locals.username_not_exists, success: true, data: null });
    } catch (error) {
        console.error("[Username Check] Error:", error);
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
};

const updateUserSignupDetails = asyncHandler(async (req, res) => {
    try {
        console.log("[Save User Details] Request received:", {
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const { firebaseToken, username, displayType, email, phone, country_code } = req.body;
        if (!firebaseToken || !username) {
            console.log("[Save User Details] Missing required fields:", { firebaseToken: !!firebaseToken, username: !!username });
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        console.log("[Save User Details] Validating Firebase token");
        let socialAuthUID = await getUidFromToken(firebaseToken);
        if (!socialAuthUID) {
            console.log("[Save User Details] Invalid Firebase token");
            return res.status(400).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }

        const existingUsername = await User.findOne({ 
            username,
            socialAuthUID: { $ne: socialAuthUID } 
        });
        if (existingUsername) {
            console.log("[Save User Details] Username already taken:", username);
            return res.status(200).send({
                message: locals.username_exists,
                success: false,
                data: null
            });
        }

        console.log("[Save User Details] Finding user with socialAuthUID:", socialAuthUID);
        let userQuery = await User.findOne({ socialAuthUID });
        
        if (!userQuery) {
            try {
                const firebaseUser = await admin.auth().getUser(socialAuthUID);
                if (firebaseUser.email) {
                    userQuery = await User.findOne({ email: firebaseUser.email });
                }
            } catch (error) {
                console.error("[Save User Details] Error getting Firebase user:", error);
            }
        }

        if (!userQuery) {
            console.log("[Save User Details] Creating new user with data:", {
                socialAuthUID,
                username,
                email,
                displayType: displayType || 'notToSay',
                phone,
                country_code
            });
            userQuery = await User.create({
                socialAuthUID,
                username,
                email,
                displayType: displayType || 'notToSay',
                role: 'user',
                email_verified: true,
                phone,
                country_code
            });
            console.log("[Save User Details] New user created:", {
                userId: userQuery._id,
                username: userQuery.username,
                email: userQuery.email,
                displayType: userQuery.displayType
            });
        } else {
            console.log("[Save User Details] Updating existing user:", {
                userId: userQuery._id,
                currentUsername: userQuery.username,
                newUsername: username,
                email,
                displayType: displayType,
                phone,
                country_code
            });
            const updateFields = {
                username: username,
                displayType: displayType || userQuery.displayType,
                socialAuthUID: socialAuthUID, 
                updatedAt: new Date(),
                email_verified: true
            };
            if (email) updateFields.email = email;
            if (phone) updateFields.phone = phone;
            if (country_code) updateFields.country_code = country_code;
            await User.updateOne(
                { _id: userQuery._id }, 
                { $set: updateFields }
            );
            
            userQuery = await User.findOne({ _id: userQuery._id });
            console.log("[Save User Details] User updated successfully");
        }

        return res.status(200).send({
            message: locals.signup_details_save,
            success: true,
            data: { accessToken: generateToken(userQuery._id, userQuery.role) }
        });

    } catch (error) {
        console.error("[Save User Details] Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const getAccessTokenByFbToken = asyncHandler(async (req, res) => {
    try {
        console.log("[Get Access Token] Request received:", {
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const { firebaseToken, email } = req.body;
        if (!firebaseToken) {
            console.log("[Get Access Token] Missing Firebase token");
            return res.status(200).json({
                message: "Firebase token is required",
                success: false,
                data: null
            });
        }

        let socialAuthUID = await getUidFromToken(firebaseToken);
        console.log("[Get Access Token] Firebase UID:", socialAuthUID);

        if (!socialAuthUID) {
            console.log("[Get Access Token] Invalid Firebase token");
            return res.status(200).json({
                message: "Invalid Firebase token",
                success: false,
                data: null
            });
        }
        let userQuery = await User.findOne({ socialAuthUID });
        
        if (!userQuery && email) {
            console.log("[Get Access Token] User not found by socialAuthUID, trying email:", email);
            userQuery = await User.findOne({ email });
            
            if (userQuery) {
                console.log("[Get Access Token] User found by email, updating socialAuthUID");
                await User.updateOne(
                    { _id: userQuery._id },
                    { socialAuthUID }
                );
            }
        }

        if (!userQuery) {
            console.log("[Get Access Token] No user found in database");
            return res.status(200).json({
                message: "User not found in database",
                success: false,
                data: null
            });
        }

        console.log("[Get Access Token] User found:", {
            userId: userQuery._id,
            email: userQuery.email,
            socialAuthUID: userQuery.socialAuthUID
        });

        return res.status(200).json({
            message: "Token generated successfully",
            success: true,
            data: { 
                accessToken: generateToken(userQuery._id, userQuery.role),
                userQuery 
            }
        });
    } catch (error) {
        console.error("[Get Access Token] Error:", error);
        return res.status(500).json({ 
            message: error.message || "Internal server error",
            success: false,
            data: null
        });
    }
});

const emailSendOTPForLogin = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (![email].every(Boolean)) {
            return res.status(200).send({ message: locals.enter_email, success: false, data: null });

        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).send({
                message: locals.email_not_exists,
                success: false,
                data: null
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        await EmailVerificationModel.updateOne({ email }, { // email_otp: await bcrypt.hash(otp.toString(), 10)
            $set: { email_otp: 123456, email_verified: false }
        });

        return res.status(200).send({ message: locals.otp_send, success: true, data: null });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const verifyEmailOTPForLogin = asyncHandler(async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (![email, otp].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        const emailVerification = await EmailVerificationModel.findOne({ email });
        if (!emailVerification) {
            return res.status(200).send({
                message: locals.email_not_exists,
                success: false,
                data: null
            });
        }

        if (emailVerification.email_otp !== otp) {
            return res.status(200).send({
                message: locals.otp_invalid,
                success: false,
                data: null
            });
        }

        await EmailVerificationModel.updateOne(
            { email },
            { email_verified: true }
        );

        const user = await User.findOne({ email });
        const accessToken = generateToken(user._id, user.role);

        return res.status(200).send({
            message: locals.otp_verified,
            success: true,
            data: { accessToken }
        });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const checkPhoneNumber = async (req, res) => {
    try {
        const { country_code, phone } = req.body;

        if (!country_code || !phone) {
            return res.status(200).json({
                success: false,
                message: locals.enter_phone,
                data: null
            });
        }
        const formattedPhoneNumber = `${country_code}${phone}`;
        try {
            const user = await admin.auth().getUserByPhoneNumber(formattedPhoneNumber);

            return res.status(200).json({
                success: true,
                message: locals.phone_exists,
                data: {
                    phone_number: user.phoneNumber,
                    email: user.email || null,
                },
            });
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                return res.status(200).json({
                    success: false,
                    message: locals.phone_not_exists_fb,
                    data: null
                });
            }
            return res.status(200).json({
                success: false,
                message: locals.server_error,
                data: null
            });
        }
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
};

const getAccessTokenByPhone = asyncHandler(async (req, res) => {
    try {
        const { phone, country_code } = req.body;
        if (![phone, country_code].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_phone,
                success: false,
                data: null
            });

        }
        // Find the user by phone
        let userQuery = await User.findOne({ phone, country_code });
        if (!userQuery) {
            return res.status(200).json({
                message: locals.phone_not_exists,
                success: false,
                data: null
            });
        }
        return res.status(200).json({
            message: locals.token_get,
            success: true,
            data: { accessToken: generateToken(userQuery._id, userQuery.role) }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const checkUserExist = asyncHandler(async (req, res) => {
    try {
        const { firebaseToken } = req.body;
        if (![firebaseToken].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_fb_token,
                success: false,
                data: null
            });

        }
        // Find the user by phone
        let socialAuthUID = await getUidFromToken(firebaseToken);
        if (!socialAuthUID) {
            return res.status(200).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }
        let userQuery = await User.findOne({ socialAuthUID });
        if (!userQuery) {
            return res.status(200).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }
        if (userQuery.status != "active") {
            return res.status(200).json({
                message: locals.user_inactive,
                success: false,
                data: null
            });
        }
        return res.status(200).json({
            message: locals.token_get,
            success: true,
            data: { user: userQuery, accessToken: generateToken(userQuery._id, userQuery.role) }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const updateUserOtherDetails = asyncHandler(async (req, res) => {
    try {
        const { interest, isNotificationAllow } = req.body;
        if (!interest && !isNotificationAllow) {
            res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });

        }
        let userQuery = await User.findOne({ _id: req.user._id });
        if (!userQuery) {
            return res.status(200).json({
                message: locals.phone_not_exists,
                success: false,
                data: null
            });
        }
        await User.updateOne({ _id: req.user._id }, { isNotificationAllow, interest });
        return res.status(200).json({
            message: locals.signup_details_save,
            success: true,
            data: null
        });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email are required." });
        }
        const user = await User.deleteOne({ email });
        return res.json({
            success: true,
            message: "User Account Deleted successful",
            data: null
        });

    } catch (error) {
        return res.status(500).json({ id: 0, message: error.message || locals.server_error });
    }
});

const updateUserDisplayDetails = asyncHandler(async (req, res) => {
    try {
        console.log("[Save Display Details] Request received:", {
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const { firebaseToken, displayName, displayType } = req.body;
        if (!firebaseToken || !displayName) {
            console.log("[Save Display Details] Missing required fields:", { firebaseToken: !!firebaseToken, displayName: !!displayName });
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        console.log("[Save Display Details] Validating Firebase token");
        let socialAuthUID = await getUidFromToken(firebaseToken);
        if (!socialAuthUID) {
            console.log("[Save Display Details] Invalid Firebase token");
            return res.status(400).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }

        console.log("[Save Display Details] Finding user with socialAuthUID:", socialAuthUID);
        let userQuery = await User.findOne({ socialAuthUID });
        
        if (!userQuery) {
            try {
                const firebaseUser = await admin.auth().getUser(socialAuthUID);
                if (firebaseUser.email) {
                    userQuery = await User.findOne({ email: firebaseUser.email });
                }
            } catch (error) {
                console.error("[Save Display Details] Error getting Firebase user:", error);
            }
        }

        if (!userQuery) {
            console.log("[Save Display Details] No user found to update");
            return res.status(200).send({
                message: "No user found to update",
                success: false,
                data: null
            });
        }

        console.log("[Save Display Details] Updating user:", {
            userId: userQuery._id,
            displayName,
            displayType
        });
        
        await User.updateOne(
            { _id: userQuery._id }, 
            { 
                $set: { 
                    displayName,
                    displayType: displayType || userQuery.displayType,
                    updatedAt: new Date()
                }
            }
        );
        
        userQuery = await User.findOne({ _id: userQuery._id });
        console.log("[Save Display Details] User updated successfully");

        return res.status(200).send({
            message: locals.signup_details_save,
            success: true,
            data: { accessToken: generateToken(userQuery._id, userQuery.role) }
        });

    } catch (error) {
        console.error("[Save Display Details] Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const saveBirthday = asyncHandler(async (req, res) => {
    try {
        console.log("[Save Birthday] Request received:", {
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const { firebaseToken, dateOfBirth } = req.body;
        if (!firebaseToken || !dateOfBirth) {
            console.log("[Save Birthday] Missing required fields:", { firebaseToken: !!firebaseToken, dateOfBirth: !!dateOfBirth });
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        console.log("[Save Birthday] Validating Firebase token");
        let socialAuthUID = await getUidFromToken(firebaseToken);
        if (!socialAuthUID) {
            console.log("[Save Birthday] Invalid Firebase token");
            return res.status(400).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }

        console.log("[Save Birthday] Finding user with socialAuthUID:", socialAuthUID);
        let userQuery = await User.findOne({ socialAuthUID });
        
        if (!userQuery) {
            try {
                console.log("[Save Birthday] No user found by socialAuthUID, checking Firebase for email");
                const firebaseUser = await admin.auth().getUser(socialAuthUID);
                if (firebaseUser.email) {
                    console.log("[Save Birthday] Found email in Firebase:", firebaseUser.email);
                    userQuery = await User.findOne({ email: firebaseUser.email });
                }
            } catch (error) {
                console.error("[Save Birthday] Error getting Firebase user:", error);
            }
        }

        if (!userQuery) {
            console.log("[Save Birthday] No user found to update");
            return res.status(200).send({
                message: "No user found to update",
                success: false,
                data: null
            });
        }

        console.log("[Save Birthday] Updating user:", {
            userId: userQuery._id,
            dateOfBirth
        });
        
        await User.updateOne(
            { _id: userQuery._id }, 
            { 
                $set: { 
                    dateOfBirth: new Date(dateOfBirth),
                    updatedAt: new Date()
                }
            }
        );
        
        userQuery = await User.findOne({ _id: userQuery._id });
        console.log("[Save Birthday] User updated successfully");

        return res.status(200).send({
            message: locals.signup_details_save,
            success: true,
            data: { accessToken: generateToken(userQuery._id, userQuery.role) }
        });

    } catch (error) {
        console.error("[Save Birthday] Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
    try {
        console.log("[Upload Profile Picture] Request received");
        
        const { firebaseToken } = req.body;
        if (!firebaseToken || !req.file) {
            console.log("[Upload Profile Picture] Missing required fields:", { 
                firebaseToken: !!firebaseToken, 
                file: !!req.file 
            });
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        console.log("[Upload Profile Picture] Validating Firebase token");
        let socialAuthUID = await getUidFromToken(firebaseToken);
        if (!socialAuthUID) {
            console.log("[Upload Profile Picture] Invalid Firebase token");
            return res.status(400).json({
                message: locals.fb_token_invalid,
                success: false,
                data: null
            });
        }

        console.log("[Upload Profile Picture] Finding user with socialAuthUID:", socialAuthUID);
        let userQuery = await User.findOne({ socialAuthUID });
        
        if (!userQuery) {
            try {
                console.log("[Upload Profile Picture] No user found by socialAuthUID, checking Firebase for email");
                const firebaseUser = await admin.auth().getUser(socialAuthUID);
                if (firebaseUser.email) {
                    console.log("[Upload Profile Picture] Found email in Firebase:", firebaseUser.email);
                    userQuery = await User.findOne({ email: firebaseUser.email });
                }
            } catch (error) {
                console.error("[Upload Profile Picture] Error getting Firebase user:", error);
            }
        }

        if (!userQuery) {
            console.log("[Upload Profile Picture] No user found to update");
            return res.status(200).send({
                message: "No user found to update",
                success: false,
                data: null
            });
        }

        try {
            const bucket = storage.bucket();
            console.log("[Upload Profile Picture] Got storage bucket:", bucket.name);
            const fileName = `profile_pictures/${userQuery._id}/${Date.now()}_${req.file.originalname}`;
            const fileUpload = bucket.file(fileName);

            console.log("[Upload Profile Picture] Starting upload to Firebase Storage:", {
                bucket: bucket.name,
                fileName: fileName
            });

            const blobStream = fileUpload.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype,
                },
                resumable: false
            });

            blobStream.on('error', (error) => {
                console.error("[Upload Profile Picture] Stream error:", error);
                return res.status(400).json({
                    message: "Error uploading file",
                    success: false,
                    data: null
                });
            });

            blobStream.on('finish', async () => {
                try {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    console.log("[Upload Profile Picture] File uploaded successfully:", publicUrl);
                    await User.updateOne(
                        { _id: userQuery._id },
                        {
                            $set: {
                                profilePic: publicUrl,
                                updatedAt: new Date()
                            }
                        }
                    );

                    userQuery = await User.findOne({ _id: userQuery._id });
                    console.log("[Upload Profile Picture] User updated successfully");

                    return res.status(200).send({
                        message: locals.signup_details_save,
                        success: true,
                        data: { 
                            accessToken: generateToken(userQuery._id, userQuery.role),
                            profilePic: publicUrl
                        }
                    });
                } catch (error) {
                    console.error("[Upload Profile Picture] Error in post-upload processing:", error);
                    return res.status(400).json({
                        message: "Error processing upload",
                        success: false,
                        data: null
                    });
                }
            });

            blobStream.end(req.file.buffer);

        } catch (error) {
            console.error("[Upload Profile Picture] Storage error:", error);
            return res.status(400).json({
                message: "Error accessing storage",
                success: false,
                data: null
            });
        }

    } catch (error) {
        console.error("[Upload Profile Picture] Error:", error);
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: error.message
        });
    }
});


// Get User by ID
const getUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 50, type } = req.query;
        const skip = (page - 1) * limit;
        const user = await SellerModel.findOne({ ownerId: userId }).populate("ownerId", 'username profilePic');
        if (!user) {
            return res.status(200).send({ message: locals.user_not_found, success: false, data: null });
        }
        const review = await reviewsModel.aggregate([
            {
                $match: {
                    sellerId: {
                        // $in: [new mongoose.Types.ObjectId('67efe32902cf412e69b9ae55')]
                        $in: [user._id]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }, // assuming the field name is 'rating'
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    averageRating: { $round: ["$averageRating", 1] }, // round to 1 decimal place
                    totalReviews: 1
                }
            }
        ]);
        const totalData = await ProductModel.countDocuments({ userId });
        let followerCount = await User.countDocuments({ followingSellers: { $in: [user._id] } });
        let soldItemCount = await orderProduct.countDocuments({ sellerId: { $in: [user._id] }, status: "sold" });
        return res.status(200).json({
            message: locals.list, success: true, data: {
                ...user._doc,
                rating: (review.length > 0) ? review[0].averageRating : 0, followerCount: followerCount, soldItemCount: soldItemCount,
            }
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

// Get Seller by ID
const getSellerById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(200).json({ message: locals.enter_all_fileds, success: false, data: null });
        }
        const sellers = await SellerModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "sellerId",
                    as: "products"
                }
            },
            {
                $unwind: {
                    path: "$products",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "products._id",
                    foreignField: "productId",
                    as: "productReviews"
                }
            },
            {
                $lookup: {
                    from: "orderproducts",
                    let: { sellerId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$sellerId", "$$sellerId"] },
                                        { $eq: ["$status", "delivery_to_buyer"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "soldItems"
                }
            },
            {
                $unwind: {
                    path: "$productReviews",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    seller: { $first: "$$ROOT" },
                    totalRating: { $sum: "$productReviews.rating" },
                    ratingCount: {
                        $sum: {
                            $cond: [
                                { $ifNull: ["$productReviews.rating", false] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    "seller.rating": {
                        $cond: [
                            { $gt: ["$ratingCount", 0] },
                            { $divide: ["$totalRating", "$ratingCount"] },
                            0
                        ]
                    },
                    "seller.ratingCount": "$ratingCount",
                    "seller.soldItemCount": { $size: "$seller.soldItems" },
                    "seller.isFollow": {
                        $cond: {
                            if: {
                                $in: ["$_id", req.user?.followingSellers || []]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $replaceRoot: { newRoot: "$seller" }
            },
            {
                $unset: ["products", "productReviews", "soldItems"]
            }
        ]);

        if (sellers.length == 0) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        return res.status(200).json({
            message: locals.fetch,
            success: true,
            data: sellers[0]
        });
    } catch (error) {
        return res.status(400).json({
            message: locals.server_error, success: false,
            data: null
        });
    }
});

// Get User by ID
const getUserById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(200).json({ message: locals.enter_all_fileds, success: false, data: null });
        }
        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(200).json({
                message: locals.user_not_found, success: false,
                data: null
            });
        }
        let purchaseProduct = await orderProduct.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,          // Optional: remove _id
                                images: 1,
                                description: 1, title: 1, sellerId: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "productvarientitems",
                    localField: "productVarientItemId",
                    foreignField: "_id",
                    as: "productVarient",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                productId: 1,
                                serialNumber: 1,
                                price: 1,
                                quantity: 1,
                                color: 1,
                                size: 1,
                                status: 1,
                                productVarientId: 1
                            }
                        }
                    ]
                }
            }
        ])

        const seller = await SellerModel.findOne({ ownerId: id }).select("name bi o profilePic isTrusted billingAddress");
        const modifiedSeller = {
            ...user._doc,
            seller: seller,
            purchasedProduct: purchaseProduct
        };
        return res.status(200).json({
            message: locals.fetch,
            success: true,
            data: modifiedSeller
        });
    } catch (error) {
        return res.status(400).json({
            message: locals.server_error, success: false,
            data: null
        });
    }
});

const blockSeller = asyncHandler(async (req, res) => {
    try {
        const { sellerId } = req.body;
        const userId = req.user._id; // Assuming you're using auth middleware

        if (!sellerId) {
            return res.status(200).json({ success: false, message: locals.enter_all_fileds, data: null });
        }

        // Check if the seller exists
        const sellerExists = await SellerModel.findById(sellerId);
        if (!sellerExists) {
            return res.status(200).json({ success: false, message: locals.user_not_found, data: null });
        }

        // Update user: add sellerId to blockedSellers if not already present
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { blockedSellers: sellerId } }, // $addToSet avoids duplicates
            { new: true }
        );

        return res.status(200).send({
            success: true,
            message: locals.block_seller,
            data: null
        });
    } catch (err) {
        return res.status(400).send({ success: false, message: locals.server_error, data: null });
    }
});

const saveDeviceToken = asyncHandler(async (req, res) => {
    try {
        const { deviceId, deviceToken, deviceType } = req.body;
        if (![deviceId, deviceToken, deviceType].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        let userQuery = await UserTokenModel.findOne({ userId: req.user._id, deviceId });
        if (!userQuery) {
            req.body.userId = req.user._id
            userQuery = await UserTokenModel.create(req.body);
        } else {
            // Update existing user
            await UserTokenModel.updateOne({ _id: userQuery._id }, { $set: req.body });
        }
        return res.status(200).send({
            message: locals.record_create,
            success: true,
            data: null
        });
    } catch (error) {
        return res.status(400).json({
            message: locals.server_error,
            success: false,
            error: null
        });
    }
});

const getProfile = asyncHandler(async (req, res) => {
    try {
        const profile = await User.findOne({ _id: req.user._id });
        const sellerProfile = await SellerModel.findOne({ ownerId: req.user._id });
        let isUserNameChange = profile.lastUsernameChangeDate < new Date()
        return res.status(200).send({ message: locals.fetch, success: true, data: { ...profile._doc, bio: sellerProfile ? sellerProfile.bio : null, isUserNameChange } });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const notificationList = asyncHandler(async (req, res) => {
    try {
        const data = await NotificationModel.find({ userId: req.user._id }).sort({ createdDate: -1 });
        let response = await Promise.all(data.map(async (item) => {
            let fromUser
            if (item.type == "seller") {
                fromUser = await User.findOne({ _id: item.fromUserId }).select("username profilePic");
            } else {
                fromUser = await SellerModel.findOne({ ownerId: item.fromUserId }).select("name profilePic");
            }
            return { ...item._doc, profilePic: fromUser.profilePic }
        }))
        return res.status(200).send({ message: locals.fetch, success: true, data: response });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const notificationRead = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        await NotificationModel.updateOne({ _id: id }, { isRead: true });
        return res.status(200).send({ message: locals.fetch, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

// Get User by ID
const getUserByIds = asyncHandler(async (req, res) => {
    try {
        const { ids } = req.body;
        let userObjectId = ids.map((item) => new mongoose.Types.ObjectId(item));
        // const data = await User.aggregate([
        //     {
        //         $match: {
        //             _id: { $in: userObjectId }
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "sellers",
        //             let: { userId: "$_id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $eq: ["$ownerId", "$$userId"]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         _id: 1,          // Optional: remove _id
        //                         name: 1,
        //                         profilePic: 1, isTrusted: 1,
        //                         followers: 1,
        //                         shopRating: "1",
        //                         itemSold: "1"
        //                     }
        //                 }
        //             ],
        //             as: "seller"
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 1,
        //             username: 1,
        //             profilePic: 1,
        //             displayName: 1,
        //             seller: 1
        //         }
        //     }
        // ]);

        const data = await User.aggregate([
            {
                $match: {
                    _id: { $in: userObjectId }
                }
            },
            {
                $lookup: {
                    from: "sellers",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$ownerId", "$$userId"]
                                }
                            }
                        },
                        // Lookup followers
                        {
                            $lookup: {
                                from: "followers",
                                localField: "_id",
                                foreignField: "sellerId",
                                as: "followerList"
                            }
                        },
                        // Lookup sold items
                        {
                            $lookup: {
                                from: "orderproducts",
                                let: { sellerId: "$_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$sellerId", "$$sellerId"] },
                                                    { $eq: ["$status", "delivery_to_buyer"] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: "soldItems"
                            }
                        },
                        // Lookup shop ratings via product -> reviews
                        {
                            $lookup: {
                                from: "products",
                                localField: "_id",
                                foreignField: "sellerId",
                                as: "products"
                            }
                        },
                        {
                            $lookup: {
                                from: "reviews",
                                let: { productIds: "$products._id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $in: ["$productId", "$$productIds"]
                                            }
                                        }
                                    }
                                ],
                                as: "shopReviews"
                            }
                        },
                        {
                            $addFields: {
                                followers: { $size: "$followerList" },
                                itemSold: { $size: "$soldItems" },
                                shopRating: {
                                    $cond: [
                                        { $gt: [{ $size: "$shopReviews" }, 0] },
                                        { $avg: "$shopReviews.rating" },
                                        0
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                profilePic: 1,
                                isTrusted: 1,
                                followers: 1,
                                shopRating: 1,
                                itemSold: 1
                            }
                        }
                    ],
                    as: "seller"
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    profilePic: 1,
                    displayName: 1,
                    seller: 1
                }
            }
        ]);

        return res.status(200).json({
            message: locals.list, success: true, data: data
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

const sendChatNotificationUser = asyncHandler(async (req, res) => {
    try {

        let { userIds, customData } = req.body
        if (!userIds || !customData) {
            return res.status(200).send({
                message: locals.enter_all_filed,
                success: false,
                data: null
            })
        }
        const token = await UserTokenModel.findOne({ userId: new mongoose.Types.ObjectId(userIds), deviceToken: { $ne: null } });
        if (token) {
            req.body.token = token.deviceToken;
            req.body.jsonString = JSON.stringify(customData);
            await sendChatNotification(req, res)
        }
        return res.status(200).send({
            message: locals.record_fetch,
            success: true,
            data: null
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
})

async function razorpayCustomerCreate(req) {
    try {
        const customer = await razorpay.customers.create({
            name: req.body.razorpayCustomName,
            // email: req.body.email,
            phone: req.body.phone,
        });
        return customer
    } catch (error) {
        console.log("Razorpay Customer Create Error ", error)
    }
}

export {
    emailSendOtp, verifyEmailOTP, usernameCheck, updateUserSignupDetails, getAccessTokenByFbToken,
    emailSendOTPForLogin, verifyEmailOTPForLogin, getAccessTokenByPhone, updateUserOtherDetails,
    checkPhoneNumber, checkUserExist, deleteUserAccount, updateUserDisplayDetails, saveBirthday,
    uploadProfilePicture, getUserById, getUser, blockSeller, saveDeviceToken, getProfile, notificationList,
    notificationRead, getUserByIds, sendChatNotificationUser, getSellerById
};
