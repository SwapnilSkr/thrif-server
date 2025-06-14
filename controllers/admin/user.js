import User from "../../models/userModel.js";
import Seller from "../../models/sellerModel.js";
import expressAsyncHandler from "express-async-handler";
import Product from "../../models/productModel.js";
import TicketModel from "../../models/resolutionConter.js";
import postModel from "../../models/postModel.js";
import productModel from "../../models/productModel.js";

const getUserList = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;

        let condition = {};

        if (search) condition.username = { $regex: search, $options: 'i' };
        if (status) condition.status = status;

        const [data, totalData] = await Promise.all([
            User.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(condition),
        ]);

        // 🟢 Metrics Section
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const [todaySignups, monthSignups, activeUsers] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ status: "active" }),
        ]);

        return res.status(200).send({
            message: locals.list,
            success: true,
            data: {
                data,
                totalPages: Math.ceil(totalData / limit),
                currentPage: Number(page),
                metrics: {
                    todaySignups,
                    monthSignups,
                    activeUsers
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});


const updateUserProfile = expressAsyncHandler(async (req, res) => {
    try {
        const { status, userId, password } = req.body;
        if (![status, userId].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_filed,
                success: false,
                data: null,
            });
        }
        if (password) req.body.password = await bcrypt.hash(password, 10);

        await User.updateOne({ _id: userId }, req.body);
        if (status == "blocked") await User.updateOne({ _id: userId }, { isBlocked: true, status: "blocked" });
        // if (status == "delete") await User.deleteOne({ _id: userId });
        if (status == "active" || status == "inactive") await User.updateOne({ _id: userId }, { status });
        if (status == "unblock" || status == "inactive") await User.updateOne({ _id: userId }, { isBlocked: false, status: "active" });

        return res.status(200).send({
            message: locals.record_edit, success: true, data: null
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const getSellerList = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;
        let condition = {}//status: "active"
        if (search) condition.name = { $regex: search, $options: 'i' }
        if (status) condition.status = status
        let data = await Seller.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalData = await User.countDocuments(condition);
        return res.status(200).send({
            message: locals.list, success: true, data: {
                data, totalData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const updateSellerProfile = expressAsyncHandler(async (req, res) => {
    try {
        const { status, userId } = req.body;
        if (![status, userId].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_filed,
                success: false,
                data: null,
            });
        }
        await Seller.updateOne({ _id: userId }, { status });
        if (status == "blocked") await Seller.updateOne({ _id: userId }, { status: "blocked" });
        if (status == "delete") await Seller.deleteOne({ _id: userId });
        if (status == "active" || status == "inactive") await User.updateOne({ _id: userId }, { status });

        return res.status(200).send({
            message: locals.record_edit, success: true, data: null
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const getSellerProfile = expressAsyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        if (![userId].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_filed,
                success: false,
                data: null,
            });
        }
        let seller = await Seller.findOne({ _id: userId });
        let products = await Product.find({ sellerId: userId });

        return res.status(200).send({
            message: locals.list, success: true, data: {
                ...seller._doc, products
            }
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const ticketList = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;
        let condition = {}//status: "active"
        // if (search) condition.username = { $regex: search, $options: 'i' }
        if (status) condition.status = status
        let data = await TicketModel.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalData = await TicketModel.countDocuments(condition);
        return res.status(200).send({
            message: locals.list, success: true, data: {
                tickets: data,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const deleteUser = expressAsyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        if (![userId].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_filed,
                success: false,
                data: null,
            });
        }
        await User.deleteOne({ _id: userId });
        await Seller.updateOne({ ownerId: userId });
        await postModel.deleteOne({ userId: userId });
        await productModel.deleteOne({ userId: userId });

        return res.status(200).send({
            message: locals.record_edit, success: true, data: null
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

export { getUserList, updateUserProfile, getSellerList, updateSellerProfile, getSellerProfile, ticketList,deleteUser }