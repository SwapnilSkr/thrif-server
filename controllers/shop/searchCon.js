import ProductModel from "../../models/productModel.js";
import productVarientModel from "../../models/productVarientModel.js";
import productVarientItemModel from "../../models/productVarientItemModel.js";
import expressAsyncHandler from "express-async-handler";
import SellerModel from "../../models/sellerModel.js";
import { makeUniqueAlphaNumeric } from "../../helpers/helper.js";
import postModel from "../../models/postModel.js";
import PostModel from "../../models/postModel.js";

const getProductAndPostBySearch = expressAsyncHandler(async (req, res) => {
    try {
        const { search, page = 1, limit = 5, type } = req.query;
        const skip = (page - 1) * limit;
        if (!search) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        // Search Sellers
        const sellers = await SellerModel.aggregate([
            { $match: { name: { $regex: search, $options: 'i' } } },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "sellerId",
                    as: "products"
                }
            },
            { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "reviews",
                    localField: "products._id",
                    foreignField: "productId",
                    as: "productReviews"
                }
            },
            { $unwind: { path: "$productReviews", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$_id",
                    seller: { $first: "$$ROOT" },
                    totalRating: { $sum: "$productReviews.rating" },
                    ratingCount: {
                        $sum: {
                            $cond: [{ $ifNull: ["$productReviews.rating", false] }, 1, 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    "seller.rating": {
                        $cond: [{ $gt: ["$ratingCount", 0] }, { $divide: ["$totalRating", "$ratingCount"] }, 0]
                    },
                    "seller.ratingCount": "$ratingCount"
                }
            },
            { $replaceRoot: { newRoot: "$seller" } },
            { $unset: ["products", "productReviews"] },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);
        const totalSellers = await SellerModel.countDocuments({ name: { $regex: search, $options: 'i' } });

        if (type === "seller") {
            return res.status(200).send({
                success: true,
                message: "Search results",
                data: { products: [], sellers },
                pagination: { page: +page, limit: +limit, totalProducts: 0, totalSellers }
            });
        }

        // Search Products
        const products = await ProductModel.aggregate([
            {
                $match: {
                    title: { $regex: search, $options: 'i' },
                    totalItems: { $gt: 0 }
                }
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "productId",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    ratingCount: { $size: "$reviews" },
                    rating: { $avg: "$reviews.rating" }
                }
            },
            { $project: { reviews: 0 } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);
        const totalProducts = await ProductModel.countDocuments({
            title: { $regex: search, $options: 'i' }
        });

        return res.status(200).send({
            success: true,
            message: "Search results",
            data: { products, sellers },
            pagination: { page: +page, limit: +limit, totalProducts, totalSellers }
        });
    } catch (error) {
        return res.status(400).send({
            message: locals.server_error,
            success: false,
            data: error
        });
    }
});

export {
    getProductAndPostBySearch
}