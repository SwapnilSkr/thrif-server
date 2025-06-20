import expressAsyncHandler from "express-async-handler";
import styleModel from "../../models/styleModel.js";
import brandModel from "../../models/brandModel.js";
import categoryModel from "../../models/categoryModel.js";
import hashtagModel from "../../models/hashtagModel.js";
import SubCategory from "../../models/subCategoryModel.js";

const getListByType = expressAsyncHandler(async (req, res) => {
    try {
        const { type } = req.params;
        if (!type) {
            return res.status(200).send({
                messagge: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let data = []
        if (type == "category") {
            data = await categoryModel.aggregate([
                { $match: { status: "active" } },
                {
                    $lookup: {
                        from: "subcategories",
                        localField: "_id",
                        foreignField: "categoryId",
                        as: "subCategories"
                    }
                }
            ])
        } else if (type == "brand") {
            data = await brandModel.find({ status: "active" });
        } else if (type == "style") {
            data = await styleModel.find({ status: "active" });
        } else {
            data = await hashtagModel.find({ status: "active" });
        }
        return res.status(200).send({
            message: locals.list,
            success: true,
            data: data
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
})

const getS3BucketDetails = expressAsyncHandler(async (req, res) => {
    try {
        return res.status(200).send({
            message: locals.list,
            success: true,
            data: {
                AWS_BUCKET: process.env.AWS_BUCKET_NAME,
                AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
                AWS_ENDPOINT: process.env.AWS_ENDPOINT,
                AWS_CDN_ENDPOINT: process.env.AWS_CDN_ENDPOINT,
                AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
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

const getLinks = expressAsyncHandler(async (req, res) => {
    try {
        return res.status(200).send({
            message: locals.list,
            success: true,
            data: {
                "privacy_policy": "https://www.google.com/",
                "faqs": "https://www.google.com/",
                "email": "https://www.google.com/",
                "terms": "https://www.google.com/"
            }
        })
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const addEditBanner = expressAsyncHandler(async (req, res) => {
    try {
        const { title, imageURL, productIds, type, id } = req.body;
        if (![title, imageURL, type].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        if (id) {
            await Banner.updateOne(req.body, { id });
        } else {
            await Banner.create(req.body);
        }
        return res.status(200).send({
            message: locals.record_create,
            success: true,
            data: null
        })
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const deleteBanner = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await Banner.deleteOne({ _id: id });
        return res.status(200).send({
            message: locals.record_delete,
            success: true,
            data: null
        })
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const getBanner = expressAsyncHandler(async (req, res) => {
    try {
        const { type } = req.query;
        let condition = { type: { $in: ["banner", "featured"] } }
        if (type) condition = { type: type }
        let data = await Banner.find(condition).sort({ createdAt: -1 });
        return res.status(200).send({
            message: locals.list,
            success: true,
            data: data
        })
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const addEditType = expressAsyncHandler(async (req, res) => {
    try {
        const { type } = req.params;
        const { title, imageURL, description, id } = req.body;
        if (![title, type].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }

        if (type == "category") {
            if (id) await categoryModel.updateOne({ _id: id }, { $set: req.body });
            if (!id) await categoryModel.create(req.body);
        } else if (type == "subCategory") {
            if (id) await SubCategory.updateOne({ _id: id }, { $set: req.body });
            if (!id) await SubCategory.create(req.body);
        } else if (type == "brand") {
            if (id) await brandModel.updateOne({ _id: id }, { $set: req.body });
            if (!id) await brandModel.create(req.body);
        } else if (type == "style") {
            if (id) await styleModel.updateOne({ _id: id }, { $set: req.body });
            if (!id) await styleModel.create(req.body);
        } else if (type == "hashtag") {
            if (id) await hashtagModel.updateOne({ _id: id }, { $set: req.body });
            if (!id) await hashtagModel.create(req.body);
        } else {
            if (id) await parcelSizes.updateOne({ _id: id }, { $set: req.body });
            if (!id) await parcelSizes.create(req.body);
        }
        return res.status(200).send({
            message: locals.record_create,
            success: true,
            data: null
        })
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

const deleteType = expressAsyncHandler(async (req, res) => {
    try {
        const { id, type } = req.params;
        if (![id, type].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        if (type == "category") {
             await categoryModel.deleteOne({_id:id});
        } else if (type == "subCategory") {
             await SubCategory.deleteOne({_id:id});
        } else if (type == "brand") {
             await brandModel.deleteOne({_id:id});
        } else if (type == "style") {
             await styleModel.deleteOne({_id:id});
        } else if (type == "hashtag") {
             await hashtagModel.deleteOne({_id:id});
        } else {
             await parcelSizes.deleteOne({_id:id});
        }
        return res.status(200).send({
            message: locals.record_delete,
            success: true,
            data: null
        })
    } catch (error) {
        console.log(error);
        
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: null
        });
    }
});

export { getListByType, getS3BucketDetails, getLinks, addEditBanner, getBanner, deleteBanner, addEditType, deleteType }