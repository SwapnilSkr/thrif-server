import expressAsyncHandler from "express-async-handler";
import postModel from "../../models/postModel.js";
import productModel from "../../models/productModel.js";
import approvalModel from "../../models/approvalModel.js";
const fetchPost = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;
        // let condition = { }
        let postData = await postModel.find({}).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalData = await postModel.countDocuments({});
        return res.status(200).send({
            message: locals.list, success: true, data: {
                postData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const postUpdate = expressAsyncHandler(async (req, res) => {
    try {
        const { id, status } = req.body;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        req.body.postId = id
        await approvalModel.create(req.body);
        if (status == "approved") req.body.status = "available"
        await postModel.updateOne({ _id: id }, { $set: req.body });
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});


const fetchProduct = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;
        // let condition = { }
        let productData = await productModel.find({}).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalData = await productModel.countDocuments({});
        return res.status(200).send({
            message: locals.list, success: true, data: {
                productData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});


const productUpdate = expressAsyncHandler(async (req, res) => {
    try {
        const { id, status } = req.body;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        req.body.productId = id
        await approvalModel.create(req.body);
        if (status == "approved") req.body.status = "available"
        let productData = await productModel.updateOne({ _id: id }, { $set: req.body });
        return res.status(200).send({ message: locals.record_edit, success: true, data: productData });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const productDelete = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let productData = await productModel.deleteOne({ _id: id });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const postDelete = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let productData = await productModel.deleteOne({ _id: id });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const approvalList = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (page - 1) * limit;
        // let condition = { }
        let approvalList = await approvalModel.find({}).skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalData = await approvalModel.countDocuments({});
        return res.status(200).send({
            message: locals.list, success: true, data: {
                approvalList,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

export {
    fetchPost, postUpdate, fetchProduct, productUpdate, productDelete, postDelete, approvalList
}