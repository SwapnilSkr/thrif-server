import ProductModel from "../../models/productModel.js";
import ProductVarientModel from "../../models/productVarientModel.js";
import ProductVarientItemsModel from "../../models/productVarientItemModel.js";
import BrandModel from "../../models/brandModel.js";
import expressAsyncHandler from "express-async-handler";
import mongoose from "mongoose";
import PostModel from "../../models/postModel.js";
import PostLikeModel from "../../models/postLikeModel.js";
import CategoryModel from "../../models/categoryModel.js";
import BannerModel from "../../models/bannerModel.js";

const defaultHome = expressAsyncHandler(async (req, res) => {
  try {
    let category = await CategoryModel.find({ status: "active" }).limit(5);
    const products = await ProductModel.aggregate([
      { $match: { userId: { $ne: req.user._id }, totalItems: { $gt: 0 } } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: "$category" }, // Convert array to object
      { $match: { "category.title": "Accessories" } } // Filter by category title
    ]).limit(5);

    const brandProducts = await ProductModel.aggregate([
      { $match: { brandId: { $ne: null }, prices: { $ne: null }, totalItems: { $gt: 0 } } },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      }
    ]).limit(5);
    let followerIds = req.user.followingSellers.map((item) => item);
    const followerProducts = await ProductModel.find({ userId: { $ne: req.user._id }, sellerId: { $in: followerIds }, totalItems: { $gt: 0 } }).select("title images prices").populate("brandId").limit(5);
    const posts = await PostModel.find({ userId: { $ne: req.user._id }, status: "active" }).limit(5);
    const banners = await BannerModel.find({ status: "active", productIds: { $eq: [] }, type: "banner" }).limit(5);
    const productBanners = await BannerModel.find({ status: "active", productIds: { $ne: [] }, type: "banner" })
      .populate("productIds")
      .limit(5);
    const featureBanner = await BannerModel.find({ status: "active", productIds: { $eq: [] }, type: "featured" }).limit(5);

    const exploreProducts = await ProductModel.aggregate([
      { $match: { userId: { $ne: req.user._id }, sellerId: { $nin: followerIds }, totalItems: { $gt: 0 } } },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
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
          as: "wishlistItems"
        }
      },
      // Join with seller
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
                isTrusted: 1
              }
            }
          ],
          as: "seller",
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
      { $limit: 5 }
    ]);
    return res.status(200).send({
      success: true,
      message: locals.list,
      data: {
        banners: banners,
        posts: posts,
        categories: category,
        brandProducts: brandProducts,
        followerProducts: followerProducts,
        bannerProducts: productBanners,
        accessories: products,
        feature: featureBanner,
        explore: exploreProducts
      }
    })
  } catch (error) {
    return res.status(400).send({ message: locals.server_error, success: false, data: null });
  }
});

const filterHome = expressAsyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      categoryIds,
      subCategoryIds,
      filter,
      brandIds,
      type,
      sellerId,
      styleIds,
      season,
      filterType,
      selfProductAndPost,
    } = req.body;

    const skip = (page - 1) * limit;
    const userId = req.user._id;
    const userInterest = req.user.interest;

    // ---------------- Match Conditions ----------------
    let matchCondition = {
      userId: { $ne: userId },
      totalItems: { $gt: 0 },
    };

    if (sellerId) matchCondition.sellerId = new mongoose.Types.ObjectId(sellerId);

    if (selfProductAndPost) {
      matchCondition = {
        userId,
        sellerId: new mongoose.Types.ObjectId(sellerId),
        totalItems: { $ne: null },
      };
    }

    if (filterType === "follow" && req.user.followingSellers?.length > 0) {
      matchCondition.sellerId = { $in: req.user.followingSellers };
    }

    if (categoryIds) {
      matchCondition.categoryId = {
        $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (subCategoryIds) {
      matchCondition.subCategoryId = {
        $in: subCategoryIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (styleIds) {
      matchCondition.styleId = {
        $in: styleIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (season) {
      matchCondition.season = { $in: season };
    }

    if (brandIds) {
      matchCondition.brandId = {
        $in: brandIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    // ---------------- Sorting Logic ----------------
    let sortStage = { updatedAt: -1 };

    if (filter) {
      if (filter.sizes) {
        matchCondition.sizes = { $in: filter.sizes };
      }

      if (filter.minPrices !== undefined) {
        matchCondition.prices = {
          $gte: filter.minPrices,
          $lte: filter.maxPrices,
        };
      }

      if (filter.colors) {
        matchCondition.colors = { $in: filter.colors };
      }

      if (filter.sortBy) {
        const sortOptions = {
          "Newest": { createdAt: -1 },
          "Lowest→Highest Price": { prices: 1 },
          "Highest→Lowest Price": { prices: -1 },
          "Recommended": { createdAt: 1 }, // Customize if needed
          "Highest→Lowest Rating": { averageRating: -1 },
          "Lowest→Highest Rating": { averageRating: 1 },
        };
        sortStage = sortOptions[filter.sortBy] || sortStage;
      }
    }

    // ---------------- Handle 'post' Type ----------------
    if (type === "post") {
      const productIds = await homePost(matchCondition);

      const postMatch = {
        productIds: { $in: productIds },
        ...(selfProductAndPost ? {} : { status: "active" }),
      };

      const postResponse = await PostModel.aggregate([
        { $match: postMatch },
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
                      { $eq: ["$userId", userId] },
                    ],
                  },
                },
              },
            ],
            as: "wishlistItems",
          },
        },
        {
          $lookup: {
            from: "sellers",
            localField: "sellerId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  profilePic: 1,
                  isTrusted: 1,
                },
              },
            ],
            as: "seller",
          },
        },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            isAddedToWishlist: {
              $cond: {
                if: { $gt: [{ $size: "$wishlistItems" }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]);

      const totalPostData = await PostModel.countDocuments(postMatch);

      return res.status(200).json({
        message: locals.list,
        success: true,
        data: {
          postData: postResponse,
          productData: [],
          totalData: totalPostData,
          totalPages: Math.ceil(totalPostData / limit),
          currentPage: page,
        },
      });
    }

    // ---------------- Product + Post Aggregation ----------------
    const pipeline = [
      { $match: matchCondition },
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
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "userWishlist",
        },
      },
      {
        $lookup: {
          from: "wishlists",
          localField: "_id",
          foreignField: "productId",
          as: "wishlistItems",
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
                isTrusted: 1,
              },
            },
          ],
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "productId",
          as: "productReviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $avg: "$productReviews.rating" }, 0],
          },
          isAddedToWishlist: {
            $gt: [{ $size: "$userWishlist" }, 0],
          },
          wishlistCount: { $size: "$wishlistItems" },
        },
      },
      ...(filter?.rating
        ? [{ $match: { averageRating: { $gte: parseFloat(filter.rating) } } }]
        : []),
      {
        $project: {
          wishlistItems: 0,
          userWishlist: 0,
          productReviews: 0,
          averageRating: 0,
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const productData = await ProductModel.aggregate(pipeline);
    const totalData = await ProductModel.countDocuments(matchCondition);

    // ---------------- Post Response Again ----------------
    const productIds = await homePost(matchCondition);
    const postCondition = {
      productIds: { $in: productIds },
      ...(selfProductAndPost ? {} : { status: "active" }),
    };

    const postResponse = await PostModel.aggregate([
      { $match: postCondition },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
                isTrusted: 1,
              },
            },
          ],
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "wishlists",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "wishlistItems",
        },
      },
      {
        $addFields: {
          isAddedToWishlist: {
            $cond: {
              if: { $gt: [{ $size: "$wishlistItems" }, 0] },
              then: true,
              else: false,
            },
          },
          wishlistCount: { $size: "$wishlistItems" },
        },
      },
      {
        $project: {
          wishlistItems: 0,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const totalPostData = await PostModel.countDocuments(postCondition);

    return res.status(200).json({
      message: locals.list,
      success: true,
      data: {
        productData,
        postData: postResponse,
        totalData,
        totalPostData,
        totalPages: Math.ceil(totalData / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("filterHome error:", error);
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const filterCount = expressAsyncHandler(async (req, res) => {
  try {
    const {
      categoryIds,
      subCategoryIds,
      filter,
      brandIds,
      type,
      sellerId,
      styleIds,
      season,
      filterType,
      selfProductAndPost,
    } = req.body;

    const userId = req.user._id;

    // ---------------- Match Conditions ----------------
    let matchCondition = {
      userId: { $ne: userId },
      totalItems: { $gt: 0 },
    };

    if (sellerId) matchCondition.sellerId = new mongoose.Types.ObjectId(sellerId);

    // if (selfProductAndPost) {
    //   matchCondition = {
    //     userId,
    //     sellerId: new mongoose.Types.ObjectId(sellerId),
    //     totalItems: { $ne: null },
    //   };
    // }

    if (filterType === "follow" && req.user.followingSellers?.length > 0) {
      matchCondition.sellerId = { $in: req.user.followingSellers };
    }

    if (categoryIds) {
      matchCondition.categoryId = {
        $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (subCategoryIds) {
      matchCondition.subCategoryId = {
        $in: subCategoryIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (styleIds) {
      matchCondition.styleId = {
        $in: styleIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (season) {
      matchCondition.season = { $in: season };
    }

    if (brandIds) {
      matchCondition.brandId = {
        $in: brandIds.map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (filter) {
      if (filter.sizes) {
        matchCondition.sizes = { $in: filter.sizes };
      }

      if (filter.minPrices !== undefined) {
        matchCondition.prices = {
          $gte: filter.minPrices,
          $lte: filter.maxPrices,
        };
      }

      if (filter.colors) {
        matchCondition.colors = { $in: filter.colors };
      }

      if (filter.rating) {
        const productWithRating = await ProductModel.aggregate([
          { $match: matchCondition },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "productId",
              as: "reviews",
            },
          },
          {
            $addFields: {
              averageRating: {
                $ifNull: [{ $avg: "$reviews.rating" }, 0],
              },
            },
          },
          {
            $match: {
              averageRating: { $gte: parseFloat(filter.rating) },
            },
          },
          { $count: "count" },
        ]);
        const productCount = productWithRating[0]?.count || 0;

        // ---------------- Post Count ----------------
        // const productIds = await homePost(matchCondition);
        // const postCondition = {
        //   productIds: { $in: productIds },
        //   ...(selfProductAndPost ? {} : { status: "active" }),
        // };

        // const postCount = await PostModel.countDocuments(postCondition);

        return res.status(200).json({
          message: locals.list,
          success: true,
          data: productCount
        });
      }
    }

    // ---------------- Product Count ----------------
    const productCount = await ProductModel.countDocuments(matchCondition);

    // ---------------- Post Count ----------------
    // const productIds = await homePost(matchCondition);
    // const postCondition = {
    //   productIds: { $in: productIds },
    //   ...(selfProductAndPost ? {} : { status: "active" }),
    // };

    // const postCount = await PostModel.countDocuments(postCondition);

    return res.status(200).json({
      message: locals.list,
      success: true,
      data: productCount
    });
  } catch (error) {
    console.error("filterHome error:", error);
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const likePost = expressAsyncHandler(async (req, res) => {
  try {
    const { postId } = req.body;
    if (![postId].every(Boolean)) {
      return res.status(200).send({
        message: locals.enter_all_fileds,
        success: false,
        data: null
      });
    }
    req.body.userId = req.user._id
    let checkAlreadyLike = await PostLikeModel.findOne({ userId: req.body.userId, postId });
    if (checkAlreadyLike) {
      await PostLikeModel.deleteOne({ _id: checkAlreadyLike._id });
      return res.status(200).send({ message: locals.post_unlike, success: true, data: null });
    }
    await PostLikeModel.create(req.body);
    return res.status(200).send({ message: locals.post_like, success: true, data: null });
  } catch (error) {
    return res.status(400).send({ message: locals.server_error, success: false, data: null });
  }
});


async function homePost(matchCondition,) {
  try {
    const result = await ProductModel.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "productvarients", // Collection name (check actual name in DB)
          localField: "_id",
          foreignField: "productId",
          as: "productVarient"
        }
      },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          as: "seller"
        }
      },
    ]);
    let ids = result.map((item) => item._id);
    return ids
  } catch (error) {
    console.log("homePost error ", error);
  }

}

export { defaultHome, filterHome, likePost, filterCount }