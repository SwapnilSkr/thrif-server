import productModel from "../../models/productModel.js";
import productVarientModel from "../../models/productVarientModel.js";
import productVarientItemModel from "../../models/productVarientItemModel.js";
import expressAsyncHandler from "express-async-handler";
import sellerModel from "../../models/sellerModel.js";
import { makeUniqueAlphaNumeric } from "../../helpers/helper.js";
import postModel from "../../models/postModel.js";
import Post from "../../models/postModel.js";
import mongoose from "mongoose";
import PostLikeModel from "../../models/postLikeModel.js";
import wishlistModel from "../../models/wishlistModel.js";
import productReview from "../../models/reviewModel.js";
import counterOffer from "../../models/counterOfferModel.js";
import cartModel from "../../models/cartModel.js";
import { saveAndSendNotification } from "../../helpers/notification.js";
import Cart from "../../models/cartModel.js";
import commentModel from "../../models/commentModel.js";
import User from "../../models/userModel.js";
import orderProduct from "../../models/orderProductModel.js";

const addProduct = expressAsyncHandler(async (req, res) => {
    try {
        const { images, title, description, price, condition, hashtag, season, size, categoryId, brandId, styleId, hashtagIds, subCategoryId, childSubCategoryId, gender, } = req.body;
        if (![images, title, description, condition, season, size, categoryId, brandId, styleId, hashtagIds].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        let seller = await sellerModel.findOne({ ownerId: req.user._id });
        if (!seller) {
            return res.status(200).send({
                message: locals.you_are_not_seller,
                success: false,
                data: null
            });
        }
        if (seller.status == "approval_pending") {
            return res.status(200).send({
                message: locals.seller_approval_pending,
                success: false,
                data: null
            });
        }
        req.body.userId = req.user._id;
        req.body.sellerId = seller._id
        let newProduct = await productModel.create(req.body);
        req.body.productId = newProduct._id
        let prices = [], colors = [], sizes = []
        let totalItems = 0
        for (const item of size) {
            let productVarientData = await productVarientModel.create({
                "size": item.size,
                "totalQuantity": item.quantity,
                "availableQuantity": item.quantity,
                "color": item.color,
                "price": item.price,
                "productId": newProduct._id
            });
            for (let index = 0; index < item.quantity; index++) {
                await productVarientItemModel.create({
                    "size": item.size,
                    // "quantity": index,
                    "color": item.color,
                    "price": item.price,
                    "productId": newProduct._id,
                    "serialNumber": makeUniqueAlphaNumeric(8),
                    "productVarientId": productVarientData._id
                });
                totalItems++
            }
            prices.push(item.price)
            colors.push(item.color)
            sizes.push(item.size)
        }
        await productModel.updateOne({ _id: newProduct._id }, { prices, colors, sizes, totalItems });
        const result = await productModel.aggregate([
            { $match: { _id: newProduct._id } },
            {
                $lookup: {
                    from: 'productvarients',         // The collection name in MongoDB
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVarient'
                }
            }
        ]);
        return res.status(200).send({
            message: locals.product_add, success: true, data: result
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const getAllAdded = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 5, search } = req.query;
        const skip = (page - 1) * limit;

        // Build match condition
        let matchCondition = { userId: req.user._id };
        if (search) {
            matchCondition.title = search;
        }

        const result = await productModel.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: "productvarients", // Collection name (check actual name in DB)
                    localField: "_id",
                    foreignField: "productId",
                    as: "productVarient"
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $sort: { createdAt: -1 } }
        ]);

        const totalData = await productModel.countDocuments(matchCondition);
        return res.status(200).send({
            message: locals.list, success: true, data: {
                data: result, totalData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addPost = expressAsyncHandler(async (req, res) => {
    try {
        const { images, video, productIds, description, hashtagIds } = req.body;
        let seller = await sellerModel.findOne({ ownerId: req.user._id });
        if (!seller) {
            return res.status(200).send({
                message: locals.you_are_not_seller,
                success: false,
                data: null
            });
        }
        req.body.userId = req.user._id
        req.body.sellerId = seller._id
        let data = await postModel.create(req.body);
        return res.status(200).send({ message: locals.post_add, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const getSelfPost = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (page - 1) * limit;
        let data = await Post.find({ userId: req.user._id, status: "active" }).skip(skip).limit(limit).sort({});
        const totalData = await Post.countDocuments({ userId: req.user._id, status: "active" });
        return res.status(200).send({
            message: locals.list, success: true, data: {
                data, totalData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
})

const getProductById = expressAsyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        let matchCondition = { _id: new mongoose.Types.ObjectId(productId) };
        await User.updateOne(
            { _id: req.user._id },
            {
                $pull: { recentViewProductIds: productId }, // remove if already exists
            }
        );

        await User.updateOne(
            { _id: req.user._id },
            {
                $push: {
                    recentViewProductIds: {
                        $each: [productId],
                        $position: 0,  // insert at the beginning
                        $slice: 10     // limit to 10 items
                    }
                }
            }
        );

        // const result = await productModel.aggregate([
        //     { $match: matchCondition },

        //     // Get seller info
        //     {
        //         $lookup: {
        //             from: "sellers",
        //             localField: "sellerId",
        //             foreignField: "_id",
        //             as: "seller",
        //             pipeline: [
        //                 {
        //                     $project: {
        //                         name: 1,
        //                         profilePic: 1,
        //                         followers: 1,
        //                     }
        //                 }
        //             ]
        //         }
        //     },
        //     { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },

        //     // Sold item count
        //     {
        //         $lookup: {
        //             from: "orderproducts",
        //             let: { sellerId: "$seller._id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$sellerId", "$$sellerId"] },
        //                                 { $eq: ["$status", "delivery_to_buyer"] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: "soldItems"
        //         }
        //     },

        //     // Related product variant details
        //     {
        //         $lookup: {
        //             from: "productvarients",
        //             localField: "_id",
        //             foreignField: "productId",
        //             as: "productVarients"
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "productvarientitems",
        //             localField: "_id",
        //             foreignField: "productId",
        //             as: "productVarientItems"
        //         }
        //     },
        //     // Add-to-cart count
        //     {
        //         $lookup: {
        //             from: "carts",
        //             localField: "_id",
        //             foreignField: "productId",
        //             as: "carts"
        //         }
        //     },
        //     // Counter offers
        //     {
        //         $lookup: {
        //             from: "counteroffers",
        //             let: { variantIds: "$productVarients._id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $in: ["$productVarientId", "$$variantIds"]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: "allCounters"
        //         }
        //     },
        //     // Counters by current user
        //     {
        //         $addFields: {
        //             counters: {
        //                 $filter: {
        //                     input: "$allCounters",
        //                     as: "counter",
        //                     cond: { $eq: ["$$counter.userId", req.user._id] }
        //                 }
        //             }
        //         }
        //     },
        //     // Reviews
        //     {
        //         $lookup: {
        //             from: "reviews",
        //             localField: "_id",
        //             foreignField: "productId",
        //             as: "reviews"
        //         }
        //     },
        //     // Wishlist
        //     {
        //         $lookup: {
        //             from: "wishlists",
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$productId", "$$CURRENT._id"] },
        //                                 { $eq: ["$userId", req.user._id] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: "wishlistItems"
        //         }
        //     },

        //     // Overall rating stats
        //     {
        //         $lookup: {
        //             from: "reviews",
        //             localField: "_id",
        //             foreignField: "productId",
        //             as: "productReviews"
        //         }
        //     },

        //     // Calculated fields
        //     {
        //         $addFields: {
        //             reviewCount: { $size: { $ifNull: ["$reviews", []] } },
        //             averageRating: { $avg: "$reviews.rating" },
        //             isAddedToWishlist: {
        //                 $cond: {
        //                     if: { $gt: [{ $size: { $ifNull: ["$wishlistItems", []] } }, 0] },
        //                     then: true,
        //                     else: false
        //                 }
        //             },
        //             peopleAddedToCart: { $size: { $ifNull: ["$carts", []] } },
        //             "seller.soldItemCount": { $size: { $ifNull: ["$soldItems", []] } },
        //             "seller.rating": "3.7144"
        //         }
        //     },
        //     // Clean result
        //     {
        //         $project: {
        //             allCounters: 0,
        //             wishlistItems: 0,
        //             carts: 0,
        //             soldItems: 0,
        //             reviews:0,
        //             productReviews:0
        //         }
        //     },
        //     { $sort: { createdAt: -1 } }
        // ]);
        const result = await productModel.aggregate([
            { $match: matchCondition },

            // Get seller info
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                profilePic: 1,
                                followers: 1,
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },

            // Sold item count
            {
                $lookup: {
                    from: "orderproducts",
                    let: { sellerId: "$seller._id" },
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

            // Related product variant details
            {
                $lookup: {
                    from: "productvarients",
                    localField: "_id",
                    foreignField: "productId",
                    as: "productVarients"
                }
            },
            {
                $lookup: {
                    from: "productvarientitems",
                    localField: "_id",
                    foreignField: "productId",
                    as: "productVarientItems"
                }
            },

            // Add-to-cart count
            {
                $lookup: {
                    from: "carts",
                    localField: "_id",
                    foreignField: "productId",
                    as: "carts"
                }
            },

            // Counter offers
            {
                $lookup: {
                    from: "counteroffers",
                    let: { variantIds: "$productVarients._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$productVarientId", "$$variantIds"]
                                }
                            }
                        }
                    ],
                    as: "allCounters"
                }
            },

            // Counters by current user
            {
                $addFields: {
                    counters: {
                        $filter: {
                            input: "$allCounters",
                            as: "counter",
                            cond: { $eq: ["$$counter.userId", req.user._id] }
                        }
                    }
                }
            },

            // Reviews
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "productId",
                    as: "reviews"
                }
            },

            // Wishlist
            {
                $lookup: {
                    from: "wishlists",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$productId", "$$CURRENT._id"] },
                                        { $eq: ["$userId", req.user._id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "wishlistItems"
                }
            },

            // Step 1: Get all products of this seller
            {
                $lookup: {
                    from: "products",
                    localField: "seller._id",
                    foreignField: "sellerId",
                    as: "sellerProducts"
                }
            },

            // Step 2: Get all reviews of those seller's products
            {
                $lookup: {
                    from: "reviews",
                    let: { sellerProductIds: "$sellerProducts._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ["$productId", "$$sellerProductIds"] }
                            }
                        }
                    ],
                    as: "sellerReviews"
                }
            },

            // Add calculated fields
            {
                $addFields: {
                    reviewCount: { $size: { $ifNull: ["$reviews", []] } },
                    averageRating: { $avg: "$reviews.rating" },
                    isAddedToWishlist: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$wishlistItems", []] } }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    peopleAddedToCart: { $size: { $ifNull: ["$carts", []] } },
                    "seller.soldItemCount": { $size: { $ifNull: ["$soldItems", []] } },
                    "seller.rating": {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ["$sellerReviews", []] } }, 0] },
                            { $avg: "$sellerReviews.rating" },
                            0
                        ]
                    }
                }
            },

            // Clean response
            {
                $project: {
                    allCounters: 0,
                    wishlistItems: 0,
                    carts: 0,
                    soldItems: 0,
                    reviews: 0,
                    sellerProducts: 0,
                    sellerReviews: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        if (result.length == 0) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null, seller: null });
        }

        // const seller = await sellerModel.aggregate([
        //     { $match: { _id: result[0].sellerId } },
        //     {
        //         $lookup: {
        //             from: "products",
        //             localField: "_id",
        //             foreignField: "sellerId",
        //             as: "products"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$products",
        //             preserveNullAndEmptyArrays: true
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "reviews",
        //             localField: "products._id",
        //             foreignField: "productId",
        //             as: "productReviews"
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "orderproducts",
        //             let: { sellerId: "$_id" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 { $eq: ["$sellerId", "$$sellerId"] },
        //                                 { $eq: ["$status", "delivery_to_buyer"] }
        //                             ]
        //                         }
        //                     }
        //                 }
        //             ],
        //             as: "soldItems"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$productReviews",
        //             preserveNullAndEmptyArrays: true
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: "$_id",
        //             seller: { $first: "$$ROOT" },
        //             totalRating: { $sum: "$productReviews.rating" },
        //             ratingCount: {
        //                 $sum: {
        //                     $cond: [
        //                         { $ifNull: ["$productReviews.rating", false] },
        //                         1,
        //                         0
        //                     ]
        //                 }
        //             }
        //         }
        //     },
        //     {
        //         $addFields: {
        //             "seller.rating": {
        //                 $cond: [
        //                     { $gt: ["$ratingCount", 0] },
        //                     { $divide: ["$totalRating", "$ratingCount"] },
        //                     0
        //                 ]
        //             },
        //             "seller.ratingCount": "$ratingCount",
        //             "seller.soldItemCount": { $size: "$seller.soldItems" },

        //         }
        //     },
        //     {
        //         $replaceRoot: { newRoot: "$seller" }
        //     },
        //     {
        //         $unset: ["products", "productReviews", "soldItems"]
        //     }
        // ]);
        // let peopleAddedToCart = await Cart.countDocuments({ productId: productId })
        return res.status(200).send({
            message: locals.list, success: true, data: {
                ...result[0],
                // itemLeft: result[0].totalItems,
                // peopleAddedToCart: peopleAddedToCart
            },
            // seller: seller[0]
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

// const getProductById = expressAsyncHandler(async (req, res) => {
//     try {
//         const { productId } = req.params;
//         let matchCondition = { _id: new mongoose.Types.ObjectId(productId) };
//         await User.updateOne(
//             { _id: req.user._id },
//             {
//                 $pull: { recentViewProductIds: productId }, // remove if already exists
//             }
//         );

//         await User.updateOne(
//             { _id: req.user._id },
//             {
//                 $push: {
//                     recentViewProductIds: {
//                         $each: [productId],
//                         $position: 0,  // insert at the beginning
//                         $slice: 10     // limit to 10 items
//                     }
//                 }
//             }
//         );

//         const result = await productModel.aggregate([
//             { $match: matchCondition },
//             {
//                 $lookup: {
//                     from: "sellers",
//                     localField: "sellerId",
//                     foreignField: "_id",
//                     as: "seller",
//                     pipeline: [
//                         {
//                             $project: {
//                                 name: 1
//                             }
//                         }
//                     ],
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$seller",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "productvarients",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "productVarients"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "productvarientitems",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "productVarientItems"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "carts",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "carts"
//                 }
//             },
//             // Lookup counters related to those product variant items
//             {
//                 $lookup: {
//                     from: "counteroffers",
//                     let: { variantIds: "$productVarients._id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $in: ["$productVarientId", "$$variantIds"]
//                                 }
//                             }
//                         }
//                     ],
//                     as: "allCounters"
//                 }
//             },
//             // Add counter count and user-specific counters
//             {
//                 $addFields: {
//                     // counterCount: { $size: "$allCounters" },
//                     counters: {
//                         $filter: {
//                             input: "$allCounters",
//                             as: "counter",
//                             cond: { $eq: ["$$counter.userId", req.user._id] }
//                         }
//                     }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "reviews",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "reviews",
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "wishlists",
//                     // let: { productIds: "$productIds" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [
//                                         { $in: ["$productId", [new mongoose.Types.ObjectId(productId)]] },
//                                         { $eq: ["$userId", req.user._id] }
//                                     ]
//                                 }
//                             }
//                         }
//                     ],
//                     as: "wishlistItems"
//                 }
//             },
//             {
//                 $addFields: {
//                     reviewCount: { $size: "$reviews" },
//                     averageRating: { $avg: "$reviews.rating" },
//                     isAddedToWishlist: {
//                         $cond: {
//                             if: { $gt: [{ $size: "$wishlistItems" }, 0] },
//                             then: true,
//                             else: false
//                         }
//                     },
//                     peopleAddedToCart: { $size: "$carts" },

//                 }
//             },
//             {
//                 $project: {
//                     reviews: 0,
//                     allCounters: 0,
//                     wishlistItems: 0,
//                     carts: 0
//                 }
//             },
//             { $sort: { createdAt: -1 } }
//         ]);
//         if (result.length == 0) {
//             return res.status(200).send({ message: locals.valid_id, success: false, data: null });
//         }
//         // let peopleAddedToCart = await Cart.countDocuments({ productId: productId })
//         return res.status(200).send({
//             message: locals.list, success: true, data: {
//                 ...result[0],
//                 // itemLeft: result[0].totalItems,
//                 // peopleAddedToCart: peopleAddedToCart
//             }
//         });
//     } catch (error) {
//         return res.status(400).send({ message: locals.server_error, success: false, data: null });
//     }
// });

const getPostById = expressAsyncHandler(async (req, res) => {
    try {
        const { postId } = req.params;
        // let matchCondition = { _id: new mongoose.Types.ObjectId(postId) };
        let checkAlreadyLike = await PostLikeModel.find({ postId: new mongoose.Types.ObjectId(postId) });
        // let result = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId) }).populate("productIds");
        let result = await Post.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(postId) } },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                name: 1
                            }
                        }
                    ],
                }
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productIds",
                    foreignField: "_id",
                    as: "products"
                }
            },
            {
                $lookup: {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    isLike: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$likes",
                                        as: "like",
                                        cond: { $eq: ["$$like.userId", req.user._id] }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    // likeCount: { $size: "$likes" },
                    isFollow: {
                        $cond: {
                            if: {
                                $in: ["$sellerId", req.user.followingSellers || []]
                            },
                            then: true,
                            else: false
                        }
                    },
                    // commentCount: 10 // Static for now; replace with real comment lookup if needed
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments"
                }
            },
        ])

        if (result.length == 0) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        return res.status(200).send({
            message: locals.list, success: true, data:
                result[0]
            // ...result._doc,
            // likeCount: checkAlreadyLike,

        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addToWishlist = expressAsyncHandler(async (req, res) => {
    try {
        const { productId, status, postId } = req.body;
        if (![(productId || postId), status].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        req.body.userId = req.user._id
        if (status == "add") {
            await wishlistModel.create(req.body);
        } else {
            await wishlistModel.deleteMany({ productId, userId: req.user._id });
        }
        return res.status(200).send({ message: locals.wishlist_add, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const wishlist = expressAsyncHandler(async (req, res) => {
    try {
        let productData = await wishlistModel.find({ userId: req.user._id, postId: { $eq: null } })//.populate("productId");
        let postData = await wishlistModel.find({ userId: req.user._id, productId: { $eq: null } })//.populate("postId");
        let proIds = productData.map((item) => item.productId);
        let postIds = postData.map((item) => item.postId);
        const result = await productModel.aggregate([
            { $match: { _id: { $in: proIds } } },
            // Join with wishlist to see if this product is in the user's wishlist
            {
                $lookup: {
                    from: "wishlists",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$productId", "$$productId"] },
                                        { $eq: ["$userId", req.user._id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "wishlistItems"
                }
            },
            // Join with seller
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller"
                }
            },
            // Add boolean indicating wishlist status
            {
                $addFields: {
                    isAddedToWishlist: {
                        $cond: {
                            if: { $gt: [{ $size: "$wishlistItems" }, 0] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
        ]);
        const postResponse = await postModel.aggregate([
            { $match: { _id: { $in: postIds }, status: "active" } },
            // Lookup wishlist entries for this post's products
            {
                $lookup: {
                    from: "wishlists",
                    let: { productIds: "$productIds" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ["$productId", "$$productIds"] },
                                        { $eq: ["$userId", req.user._id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "wishlistItems"
                }
            },
            // Lookup seller info
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller"
                }
            },
            // Add boolean field based on wishlist presence
            {
                $addFields: {
                    isAddedToWishlist: {
                        $cond: {
                            if: { $gt: [{ $size: "$wishlistItems" }, 0] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
        ]);
        return res.status(200).send({ message: locals.list, success: true, data: { postData: postResponse, productData: result } });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addReview = expressAsyncHandler(async (req, res) => {
    try {
        const { rating, productVarientItemId, productId, reviewsTitle, reviewsDescription, id } = req.body;
        if (![rating, productVarientItemId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        let productCheck = await productModel.findOne({ _id: productId });
        if (!productCheck) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        let productItemCheck = await productVarientItemModel.findOne({ _id: productVarientItemId });
        if (!productItemCheck) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        req.body.userId = req.user._id
        req.body.serialNumber = productItemCheck.serialNumber
        req.body.sellerId = productCheck.sellerId
        // if (id) {
        //     await productReview.deleteMany({ _id: id });
        // }
        await productReview.create(req.body);

        return res.status(200).send({ message: locals.review_add, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const updateReview = expressAsyncHandler(async (req, res) => {
    try {
        const { rating, reviewsTitle, reviewsDescription, id, helpfullYes, helpfullNo } = req.body;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        let productCheck = await productReview.findOne({ _id: id });
        if (!productCheck) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        let userId = req.user._id
        if (helpfullYes) {
            await productReview.updateOne({ _id: id }, { $addToSet: { helpfullYes: userId }, $pull: { helpfullNo: userId } });
        } else if (helpfullNo) {
            await productReview.updateOne({ _id: id }, { $addToSet: { helpfullNo: userId }, $pull: { helpfullYes: userId } });
        } else {
            await productReview.updateOne({ _id: id }, { $set: req.body });
        }
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});


const reviewListByProdId = expressAsyncHandler(async (req, res) => {
    try {
        const { prodId } = req.params;
        let productData = await productReview.find({ productId: prodId }).populate("userId", "profilePic displayName username isVerify").populate("productVarientItemId", "size color");
        let isReview = await productReview.findOne({ productId: prodId, userId: req.user._id });
        let isAbleForReview = await orderProduct.findOne({ productId: prodId, userId: req.user._id });

        return res.status(200).send({ message: locals.list, success: true, data: productData, isReview: isReview, isAbleForReview: isAbleForReview ? true : false });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const reviewCheck = expressAsyncHandler(async (req, res) => {
    try {
        const { productId, productVarientItemId } = req.body;
        let productData = await productReview.findOne({ productId, productVarientItemId, userId: req.user._id });
        return res.status(200).send({ message: locals.list, success: true, data: productData });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const sendOffer = expressAsyncHandler(async (req, res) => {
    try {
        const { productId, productVarientId, offerPercentage, afterDiscountAmt, beforeDiscount } = req.body;
        if (![productId, productVarientId, afterDiscountAmt, beforeDiscount].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        let productData = await productModel.findOne({ _id: productId });
        if (!productData) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }

        let productVarientData = await productVarientModel.findOne({ _id: productVarientId });
        if (!productVarientData) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        let productVarientItemData = await productVarientItemModel.findOne({ status: "available", productVarientId, productId });
        if (!productVarientItemData) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        req.body.userId = req.user._id
        req.body.sellerId = productData.sellerId
        req.body.productVarientItemId = productVarientItemData._id
        let data = await counterOffer.create(req.body);
        req.body.actionId = data._id
        req.body.userId = productData.sellerId
        req.body.type = "seller"
        req.body.notificationType = "offerReceive";
        req.body.fromUserId = req.user._id
        await saveAndSendNotification(req, res);
        return res.status(200).send({ message: locals.wishlist_add, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const sellerUpdateOffer = expressAsyncHandler(async (req, res) => {
    try {
        const { status, offerId, afterDiscountAmt } = req.body;
        if (![status, offerId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        // let seller = await sellerModel.findOne({ ownerId: req.user._id });
        // if (!seller) {
        //     return res.status(200).send({
        //         message: locals.you_are_not_seller,
        //         success: false,
        //         data: null
        //     });
        // }
        let data = await counterOffer.findOne({ _id: offerId });//.populate("userId", "displayName username profilePic").populate("productId", "title description images").sort({ updatedAt: -1 });
        if (!data) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        const availableStatus = [
            "accept", "decline", "counter", "cancel", "pickup", "delete"
        ]
        if (!availableStatus.includes(status)) {
            return res.status(200).send({ message: locals.selete_valide_status, success: false, data: null });
        }
        let updateStatus
        if (status == "decline") {
            updateStatus = "declineBySeller"
            req.body.notificationType = "offerCancel";
        }
        if (status == "counter") {
            updateStatus = "counterBySeller"
            req.body.notificationType = "offerReceive";
        }
        if (status == "accept") {
            updateStatus = "acceptBySeller"
            req.body.notificationType = "offerAccept";
        }
        if (status == "delete") {
            await counterOffer.deleteOne({ _id: offerId });
            return res.status(200).send({ message: locals.record_delete, success: true, data: null });
        } else {
            await counterOffer.updateOne({ _id: offerId }, {
                $set: {
                    status: updateStatus, afterDiscountAmt
                }
            })
        }
        req.body.actionId = offerId
        req.body.userId = data.sellerId
        req.body.type = "user"
        req.body.fromUserId = req.user._id
        await saveAndSendNotification(req, res);
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const offerList = expressAsyncHandler(async (req, res) => {
    try {
        let seller = await sellerModel.findOne({ ownerId: req.user._id });
        let condition = { userId: req.user._id }
        if (seller) condition = { $or: [{ userId: req.user._id }, { sellerId: seller._id }] }
        let data = await counterOffer.find(condition).populate("userId", "displayName username profilePic").populate("sellerId", "isTrusted name bio profilePic").populate("productId", "title description images").sort({ updatedAt: -1 });
        return res.status(200).send({ message: locals.list, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const buyerUpdateOffer = expressAsyncHandler(async (req, res) => {
    try {
        const { status, offerId, afterDiscountAmt } = req.body;
        if (![status, offerId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        const availableStatus = [
            "accept", "decline", "counter", "cancel", "pickup", "delete"
        ]
        if (!availableStatus.includes(status)) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        let offerData = await counterOffer.findOne({ _id: offerId });
        if (!offerData) {
            return res.status(200).send({ message: locals.valid_id, success: false, data: null });
        }
        let updateStatus
        if (status == "decline") {
            updateStatus = "declineByBuyer"
            req.body.notificationType = "offerCancel";
        }
        if (status == "counter") {
            req.body.notificationType = "offerReceive";
            updateStatus = "counterByBuyer"
        }
        if (status == "accept") {
            updateStatus = "acceptByBuyer"
            req.body.notificationType = "offerAccept";
        }
        if (status == "delete") {
            await counterOffer.deleteOne({ _id: offerId });
            return res.status(200).send({ message: locals.record_delete, success: true, data: null });
        } else {
            await counterOffer.updateOne({ _id: offerId }, {
                $set: {
                    status: updateStatus, afterDiscountAmt
                }
            });
        }
        req.body.actionId = offerId
        req.body.userId = offerData.sellerId
        req.body.type = "seller"
        req.body.fromUserId = req.user._id
        await saveAndSendNotification(req, res);
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addItemToCart = expressAsyncHandler(async (req, res) => {
    try {
        const { productVarientId, productId, quantity } = req.body;
        if (![productVarientId, productId, quantity].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        req.body.userId = req.user._id
        let product = await productModel.findById(productId);
        if (!product)
            return res.status(200).send({
                message: locals.valid_id,
                success: false,
                data: null
            });
        req.body.sellerId = product.sellerId
        let checkItemAlreadtAdded = await cartModel.findOne({ productId, productVarientId, userId: req.user._id });
        if (checkItemAlreadtAdded) {
            await cartModel.updateOne({ _id: checkItemAlreadtAdded._id }, {
                $inc: { quantity: +quantity }
            });
        } else {
            await cartModel.create(req.body);
        }
        return res.status(200).send({ message: locals.record_create, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const cartList = expressAsyncHandler(async (req, res) => {
    try {
        // let data = await cartModel.find({ userId: req.user._id })
        //     .populate("productId", "title images description sellerId")
        //     .populate("productVarientId", "color size status totalQuantity price availableQuantity")
        //     .populate("sellerId", "ownerId name bio profilePic")
        //     .sort({ createdAt: -1 });

        let data = await cartModel.aggregate([
            { $match: { userId: req.user._id } },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product",
                    pipeline: [
                        {
                            $project: {
                                _id: 1, title: 1, images: 1, description: 1, sellerId: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "productvarients",
                    localField: "productVarientId",
                    foreignField: "_id",
                    as: "productvarient",
                    pipeline: [
                        {
                            $project: {
                                _id: 1, color: 1, size: 1, status: 1, totalQuantity: 1, price: 1, availableQuantity: 1,
                            }
                        }

                    ],
                }
            },
            {
                $unwind: {
                    path: "$productvarient",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                _id: 1, name: 1, bio: 1, profilePic: 1
                            }
                        }
                    ],

                }
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "counteroffers",
                    localField: "productVarientId",
                    foreignField: "productVarientId",
                    as: "counter",
                    pipeline: [
                        { $match: { status: { $in: ["acceptBySeller", "acceptByBuyer"] } } }
                    ]
                }
            },
            // {
            //     $set: {
            //         counter: { $arrayElemAt: ["$counter", 0] } // will set to null if no data
            //     }
            // },
            // {
            //     $unwind: {
            //         path: "$counter",
            //         preserveNullAndEmptyArrays: true
            //     }
            // },
            // {
            //     $match: {
            //         $or: [
            //             { counter: null },
            //             { "counter.status": { $in: ["acceptBySeller", "acceptByBuyer"] } }
            //         ]
            //     }
            // },
            {
                $sort: { updatedAt: -1 } // or use another field like createdAt: -1
            }
        ]);
        return res.status(200).send({ message: locals.list, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const editCart = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.body;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await cartModel.updateOne({ _id: id }, { $set: req.body });
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const deleteItemFromCart = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await cartModel.deleteOne({ _id: id });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const fetchPost = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;
        const skip = (page - 1) * limit;
        const postData = await postModel.aggregate([
            { $match: { status: "active", userId: { $ne: req.user._id } } },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller"
                }
            },
            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "postlikes",
                    localField: "_id",
                    foreignField: "postId",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    isLike: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$likes",
                                        as: "like",
                                        cond: { $eq: ["$$like.userId", req.user._id] }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    likeCount: { $size: "$likes" },
                    isFollow: {
                        $cond: {
                            if: {
                                $in: ["$sellerId", req.user.followingSellers || []]
                            },
                            then: true,
                            else: false
                        }
                    },
                    // commentCount: 10 // Static for now; replace with real comment lookup if needed
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        const totalPostData = await postModel.countDocuments({ status: "active" });
        return res.status(200).send({
            message: locals.list, success: true, data: {
                postData, totalPostData,
                totalPages: Math.ceil(totalPostData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
})

const addComment = expressAsyncHandler(async (req, res) => {
    try {
        const { comment, postId } = req.body;
        if (![comment, postId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        req.body.userId = req.user._id
        let post = await postModel.findById(postId);
        if (!post)
            return res.status(200).send({
                message: locals.valid_id,
                success: false,
                data: null
            });
        await commentModel.create(req.body);
        return res.status(200).send({ message: locals.comment_add, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const replyComment = expressAsyncHandler(async (req, res) => {
    try {
        const { reply, commentId } = req.body;
        if (![reply, commentId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let seller = await sellerModel.findOne({ ownerId: req.user._id });
        if (!seller) {
            return res.status(200).send({
                message: locals.you_are_not_seller,
                success: false,
                data: null
            });
        }
        req.body.userId = req.user._id
        let comment = await commentModel.findById(commentId);
        if (!comment)
            return res.status(200).send({
                message: locals.valid_id,
                success: false,
                data: null
            });
        if (comment.reply)
            return res.status(200).send({
                message: locals.reply_already,
                success: false,
                data: null
            });
        await commentModel.updateOne({ _id: commentId }, {
            $set: {
                reply: {
                    sellerId: seller._id, reply, date: new Date()
                }
            }
        });

        return res.status(200).send({ message: locals.comment_add, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const getProductBySellerId = expressAsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (page - 1) * limit;
        const { sellerId, styleId } = req.body;
        if (![styleId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let postCondition = { styleId: new mongoose.Types.ObjectId(styleId), totalItems: { $gt: 0 } }
        if (sellerId) postCondition.sellerId = new mongoose.Types.ObjectId(sellerId)
        const data = await productModel.aggregate([
            { $match: postCondition },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                bio: 1,
                                profilePic: 1,
                                isAadharNumberVerify: 1
                            }
                        }
                    ],
                }
            },
            {
                $lookup: {
                    from: "wishlists",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$productId", "$$productId"] },
                                        { $eq: ["$userId", req.user._id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "userWishlist"
                }
            },

            // Lookup to count how many users added this to wishlist
            {
                $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "productId",
                    as: "allWishlists"
                }
            },

            // Add fields
            {
                $addFields: {
                    isAddedToWishlist: {
                        $cond: {
                            if: { $gt: [{ $size: "$userWishlist" }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    wishlistCount: { $size: "$allWishlists" }
                }
            },

            // Pagination
            { $skip: skip },
            { $limit: parseInt(limit) },

            // Optional: clean up
            {
                $unset: ["userWishlist", "allWishlists"]
            }
        ]);
        const totalData = await productModel.countDocuments(postCondition);
        let sellerData = []
        if (sellerId) {
            sellerData = await sellerModel.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(sellerId) } },

                // Lookup products
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

                // Lookup product reviews
                {
                    $lookup: {
                        from: "reviews",
                        localField: "products._id",
                        foreignField: "productId",
                        as: "productReviews"
                    }
                },
                {
                    $unwind: {
                        path: "$productReviews",
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Lookup orderProducts with matching sellerId and delivered status
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
                        as: "deliveredOrders"
                    }
                },

                // Grouping for ratings
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
                        },
                        itemSold: { $first: { $size: "$$ROOT.deliveredOrders" } }
                    }
                },

                // Add calculated fields
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
                        "seller.itemSold": "$itemSold"
                    }
                },

                // Flatten back
                {
                    $replaceRoot: { newRoot: "$seller" }
                },

                // Cleanup
                {
                    $unset: ["products", "productReviews", "deliveredOrders"]
                }
            ]);

            if (sellerData.length == 0) {
                return res.status(200).send({
                    message: locals.valid_id,
                    success: false,
                    data: null
                })
            }
        }
        return res.status(200).send({
            message: locals.list, success: true, data: {
                data, sellerData: sellerData[0] || null, totalData,
                totalPages: Math.ceil(totalData / limit),
                currentPage: page
            }
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const fetchRecentViewProducts = expressAsyncHandler(async (req, res) => {
    try {
        const data = await productModel.aggregate([
            { $match: { totalItems: { $gt: 0 }, _id: { $in: req.user.recentViewProductIds } } },
            {
                $lookup: {
                    from: 'productvarients',         // The collection name in MongoDB
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVarient'
                }
            },
            {
                $lookup: {
                    from: "sellers",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                bio: 1,
                                profilePic: 1,
                                isAadharNumberVerify: 1
                            }
                        }
                    ],
                }
            },
            {
                $lookup: {
                    from: "wishlists",
                    let: { productId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$productId", "$$productId"] },
                                        { $eq: ["$userId", req.user._id] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "userWishlist"
                }
            },

            // Lookup to count how many users added this to wishlist
            {
                $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "productId",
                    as: "allWishlists"
                }
            },

            // Add fields
            {
                $addFields: {
                    isAddedToWishlist: {
                        $cond: {
                            if: { $gt: [{ $size: "$userWishlist" }, 0] },
                            then: true,
                            else: false
                        }
                    },
                    wishlistCount: { $size: "$allWishlists" }
                }
            },
            // Optional: clean up
            {
                $unset: ["userWishlist", "allWishlists"]
            }
        ]);
        return res.status(200).send({
            message: locals.list, success: true, data: data
        });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
})

const productDelete = expressAsyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        if (![productId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await productModel.deleteOne({ _id: productId });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });

    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const postDelete = expressAsyncHandler(async (req, res) => {
    try {
        const { postId } = req.params;
        if (![postId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await postModel.deleteOne({ _id: postId });
        await wishlistModel.deleteMany({ postId: postId });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});
async function calculateProductRatting(productData) {
    let total = productData.reduce((acc, item) => acc + item.ratting, 0);
    return total / productData.length
}

export {
    addProduct, getAllAdded, addPost, getSelfPost, getProductById, getPostById, addToWishlist, wishlist, addReview, reviewListByProdId, sendOffer, sellerUpdateOffer, buyerUpdateOffer, offerList,
    addItemToCart, cartList, deleteItemFromCart, editCart, fetchPost, addComment, replyComment, getProductBySellerId, fetchRecentViewProducts, updateReview, reviewCheck, postDelete, productDelete
}