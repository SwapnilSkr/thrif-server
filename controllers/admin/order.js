import order from '../../models/orderModel.js';
import orderProduct from '../../models/orderProductModel.js';
import expressAsyncHandler from 'express-async-handler';
import addressModel from '../../models/addressModel.js';
import userModel from '../../models/userModel.js';
import sellerTransactionModel from '../../models/sellerTransactionsModel.js';
import User from '../../models/userModel.js';

const orderStatusUpdate = expressAsyncHandler(async (req, res) => {
  try {
    const { orderId, status, orderProductId } = req.body;
    if (![orderId, status, orderProductId].every(Boolean)) {
      return res.status(200).send({
        message: locals.enter_all_fileds,
        success: false,
        data: null,
      });
    }
    let orderProductData = await orderProduct
      .findOne({ orderId, _id: orderProductId })
      .populate('orderId');
    if (!orderProductData) {
      return res.status(200).send({
        message: locals.valid_id,
        success: false,
        data: null,
      });
    }
    await orderProduct.updateOne(
      { orderId, _id: orderProductId, 'deliveryProgress.step': status },
      {
        $set: {
          'deliveryProgress.$.status': 'completed',
          'deliveryProgress.$.date': new Date(),
          status,
        },
      }
    );
    if (status == 'delivery_to_buyer') {
      let address = await addressModel.findOne({
        _id: orderProductData.orderId.deliveryAddressId,
      });
      let buyer = await userModel.findOne({ _id: orderProductData.userId });
      req.body.productId = orderProductData.productId;
      req.body.gender = buyer.gender;
      req.body.age = await getAge(buyer.dateOfBirth);
      req.body.city = address.city;
      req.body.price = orderProductData.price;
      req.body.sellerId = orderProductData.sellerId;
      req.body.buyerId = orderProductData.userId;
      req.body.status = 'completed';
      await sellerTransactionModel.create(req.body);
      const totalCount = await orderProduct.countDocuments({ orderId });
      const deliveredCount = await orderProduct.countDocuments({ orderId, status: "delivery_to_buyer" });
      const allDelivered = totalCount > 0 && totalCount === deliveredCount;
      if (allDelivered)
        await order.updateOne(
          { _id: orderId, },
          {
            $set: {
              status: "delivered",
            },
          }
        );
    }
    return res.status(200).send({
      message: locals.record_edit,
      success: true,
      data: null,
    });
  } catch (error) {
    console.log("error ", error);

    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

function getAge(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
}

//Withdrawal

const sellerTransactionList = expressAsyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const skip = (page - 1) * limit;
    let condition = { type: 'withdraw' };
    // if (search) condition.username = { $regex: search, $options: 'i' }
    if (status) condition.status = status;
    let data = await sellerTransactionModel
      .find(condition)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalData = await sellerTransactionModel.countDocuments(condition);
    return res.status(200).send({
      message: locals.list,
      success: true,
      data: {
        tickets: data,
        totalPages: Math.ceil(totalData / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    return res.status(400).send({
      message: locals.server_error,
      success: false,
      data: null,
    });
  }
});

const withdrawalUpdated = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    if (![id].every(Boolean)) {
      return res.status(200).send({
        message: locals.enter_all_fileds,
        success: false,
        data: null,
      });
    }
    let orderProductData = await sellerTransactionModel.findOne({ _id: id });
    if (!orderProductData) {
      return res.status(200).send({
        message: locals.valid_id,
        success: false,
        data: null,
      });
    }
    let transactionId = "T2589023674657637452"//Static
    await sellerTransactionModel.updateOne(
      { _id: id },
      { $set: { status: 'completed', isWithdrwal: 'completed', transactionId } }
    );
    await sellerTransactionModel.updateMany(
      { sellerId: orderProductData.sellerId, isWithdrwal: 'requested' },
      {
        $set: {
          isWithdrwal: 'completed', transactionId
        },
      }
    );
    return res
      .status(200)
      .send({ message: locals.record_edit, success: true, data: null });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const orderList = expressAsyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status } = req.query;
    const skip = (page - 1) * limit;

    let matchConditions = [];

    // Global search on user.name or orderProducts.seller.shopName
    if (search) {
      matchConditions.push({
        $or: [
          { 'user.username': { $regex: search, $options: 'i' } },
          { 'orderProducts.seller.name': { $regex: search, $options: 'i' } },
        ],
      });
    }

    let pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                profilePic: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'orderproducts',
          localField: '_id',
          foreignField: 'orderId',
          as: 'orderProducts',
        },
      },
      {
        $unwind: {
          path: '$orderProducts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'orderProducts.productId',
          foreignField: '_id',
          as: 'orderProducts.productDetails',
        },
      },
      {
        $unwind: {
          path: '$orderProducts.productDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'orderProducts.sellerId',
          foreignField: '_id',
          as: 'orderProducts.seller',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                bio: 1,
                profilePic: 1,
                isAadharNumberVerify: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$orderProducts.seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'productvarients',
          localField: 'orderProducts.productVarientId',
          foreignField: '_id',
          as: 'orderProducts.productVarientDetails',
        },
      },
      {
        $unwind: {
          path: '$orderProducts.productVarientDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'productvarientitems',
          localField: 'orderProducts.productVarientItemId',
          foreignField: '_id',
          as: 'orderProducts.productVarientItems',
        },
      },
      {
        $group: {
          _id: '$_id',
          orderDetails: { $first: '$$ROOT' },
          orderProducts: { $push: '$orderProducts' },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$orderDetails',
              { orderProducts: '$orderProducts' },
            ],
          },
        },
      },
    ];

    // Inject optional filters
    if (matchConditions.length) {
      pipeline.push({
        $match: {
          $and: matchConditions,
        },
      });
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );
    const orderData = await order.aggregate(pipeline);
    const totalPostData = await order.countDocuments();

    // 🟢 METRICS SECTION
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Order conversion rate requires visitor tracking, so this is placeholder logic
    const [ordersToday, ordersThisWeek, ordersThisMonth, totalOrders] =
      await Promise.all([
        order.countDocuments({ createdAt: { $gte: startOfToday } }),
        order.countDocuments({ createdAt: { $gte: startOfWeek } }),
        order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        order.countDocuments(),
      ]);
    // Optionally: Get total number of signed-up users for rough conversion rate
    const totalUsers = await User.countDocuments();
    // Placeholder Conversion Rate (real one needs sessions or analytics)
    const roughConversionRate = ((totalOrders / totalUsers) * 100).toFixed(2);
    return res.status(200).send({
      message: locals.list,
      success: true,
      data: orderData,
      totalPages: Math.ceil(totalPostData / limit),
      currentPage: parseInt(page),
      metrics: {
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        totalOrders,
        roughConversionRate: `${roughConversionRate}%`,
      },
    });
  } catch (error) {
    return res.status(400).json({
      message: locals.server_error,
      success: false,
      data: null,
    });
  }
});

export {
  orderStatusUpdate,
  sellerTransactionList,
  withdrawalUpdated,
  orderList,
};
