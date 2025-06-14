import expressAsyncHandler from 'express-async-handler';
import sellerModel from '../../models/sellerModel.js';
import userModel from '../../models/userModel.js';
import { saveAndSendNotification } from '../../helpers/notification.js';
import orderProduct from '../../models/orderProductModel.js';
import sellerTransactionModel from '../../models/sellerTransactionsModel.js';
const register = expressAsyncHandler(async (req, res) => {
  try {
    const {
      name,
      bio,
      gstNumber,
      panNumber,
      aadharNumber,
      billingAddress,
      aadharVerificationCode,
      paymentMethode,
      paymentDetails,
      profilePic,
    } = req.body;
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });

    if (aadharNumber) {
      // const otp = Math.floor(100000 + Math.random() * 900000);
      // let aadharNumberVerify = await sendAadharOTP(aadharNumber);
      // if (!aadharNumberVerify)
      //     return res.status(200).send({ message: locals.valid_aadhar, success: false, data: null });
      const aadharNumberExist = await sellerModel.findOne({ aadharNumber });
      if (sellerProfile || aadharNumber == sellerProfile.aadharNumber) {
        return res.status(200).send({
          message: locals.otp_send,
          success: true,
          data: null,
        });
      }
      if (aadharNumberExist) {
        return res.status(200).send({
          message: locals.aadharNumber_exists,
          success: false,
          data: null,
        });
      }
      return res
        .status(200)
        .send({ message: locals.aadhar_otp, success: true, data: null });
    }
    if (!sellerProfile) {
      req.body.ownerId = req.user._id;
      await sellerModel.create(req.body);
    } else {
      await sellerModel.updateOne({ ownerId: req.user._id }, req.body);
    }
    return res
      .status(200)
      .send({ message: locals.seller_details_save, success: true, data: null });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const verifyAadharOTP = expressAsyncHandler(async (req, res) => {
  try {
    const { aadharNumber, otp, txnId } = req.body;
    if (!aadharNumber || !otp) {
      return res
        .status(200)
        .send({ message: locals.enter_all_fileds, success: false, data: null });
    }
    // const response = await axios.post(`${AADHAR_API_URL}/verify-otp`, {
    //     aadharNumber,
    //     otp,
    //     txnId
    // }, {
    //     headers: { "Authorization": `Bearer ${API_KEY}` }
    // });
    // if (response) {
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });
    if (!sellerProfile) {
      return res.status(200).send({
        message: locals.you_are_not_seller,
        success: false,
        data: null,
      });
    }
    if (otp != '123456') {
      return res
        .status(200)
        .send({ message: locals.valid_otp, success: false, data: null });
    }
    await sellerModel.updateOne(
      { ownerId: req.user._id },
      { isAadharNumberVerify: true, status: 'active' }
    );
    return res
      .status(200)
      .send({ message: locals.otp_verify, success: true, data: null });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const getProfile = expressAsyncHandler(async (req, res) => {
  try {
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });
    return res
      .status(200)
      .send({ message: locals.fetch, success: true, data: sellerProfile });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

// become followers
const followUnfollowSeller = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { sellerId, type } = req.body;

    if (![sellerId, type].every(Boolean)) {
      return res.status(400).send({
        message: locals.enter_all_filed,
        success: false,
        data: null,
      });
    }

    // const userData = await UserModel.findById(userId);
    const sellerData = await sellerModel.findById(sellerId);

    if (!sellerData) {
      return res.status(404).send({
        message: 'User or Seller not found',
        success: false,
        data: null,
      });
    }

    if (type === 'follow') {
      // if (userData.followingSellers.includes(sellerId)) {
      //     return res.status(200).send({
      //         success: false,
      //         message: "Already following this seller.",
      //         data: null,
      //     });
      // }

      await userModel.updateOne(
        { _id: userId },
        { $addToSet: { followingSellers: sellerId } }
      );
      await sellerModel.updateOne(
        { _id: sellerId },
        { $addToSet: { followers: userId } }
      );
      req.body.actionId = userId;
      req.body.userId = sellerData.ownerId;
      req.body.type = 'seller';
      req.body.name = req.user.username;
      req.body.fromUserId = req.user._id;
      req.body.notificationType = 'followSeller';
      await saveAndSendNotification(req, res);
    } else if (type === 'unfollow') {
      // if (!userData.followingSellers.includes(sellerId)) {
      //     return res.status(200).send({
      //         success: false,
      //         message: "You are not following this seller.",
      //         data: null,
      //     });
      // }

      await userModel.updateOne(
        { _id: userId },
        { $pull: { followingSellers: sellerId } }
      );
      await sellerModel.updateOne(
        { _id: sellerId },
        { $pull: { followers: userId } }
      );
    } else {
      return res.status(400).send({
        success: false,
        message: 'Invalid follow/unfollow type.',
        data: null,
      });
    }

    return res.status(200).send({
      success: true,
      message:
        type === 'follow'
          ? 'Seller followed successfully.'
          : 'Seller unfollowed successfully.',
      data: null,
    });
  } catch (err) {
    return res.status(500).send({
      message: locals.something_went_wrong,
      success: false,
      data: null,
    });
  }
});

const wallet = expressAsyncHandler(async (req, res) => {
  try {
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });
    if (!sellerProfile) {
      return res.status(200).send({
        message: locals.you_are_not_seller,
        success: false,
        data: null
      });
    }
    let transaction = await sellerTransactionModel.find({ sellerId: sellerProfile._id }).populate("buyerId", "_id profilePic username displayName").populate("productId", "_id title images")
    .populate("sellerId", "_id paymentMethode paymentDetails").populate("orderId", "_id paymentId paymentType").sort({ createdAt: -1 });
    const result = await sellerTransactionModel.aggregate([
      {
        $match: {
          sellerId: sellerProfile._id,
          isWithdrwal: "no"
        }
      },
      {
        $group: {
          _id: null,
          totalPrice: { $sum: "$price" }
        }
      }
    ]);
    const upcomingsTransaction = await orderProduct.find({ sellerId: sellerProfile._id, status: "shipped_by_seller" }).populate("productId", "_id title");
    return res.status(200).send({
      message: locals.fetch, success: true, data: {
        transaction,
        totalBalance: result[0]?.totalPrice || 0,
        upcomingsTransaction
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(400).send({ message: locals.server_error, success: false, data: null });
  }
});

const addWithdrwalRequest = expressAsyncHandler(async (req, res) => {
  try {
    const { price } = req.body;
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });
    if (!sellerProfile) {
      return res.status(200).send({
        message: locals.you_are_not_seller,
        success: false,
        data: null,
      });
    }
    if (!price) {
      return res.status(200).send({
        message: locals.enter_all_fileds,
        success: false,
        data: null,
      });
    }
    req.body.sellerId = sellerProfile._id;
    req.body.type = 'withdraw';
    req.body.status = 'inProgress';
    await sellerTransactionModel.create(req.body);
    await sellerTransactionModel.updateMany(
      { sellerId: sellerProfile._id, isWithdrwal: 'no' },
      {
        $set: {
          isWithdrwal: 'requested',
        },
      }
    );
    return res
      .status(200)
      .send({ message: locals.seller_details_save, success: true, data: null });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const sellingAnalytics = expressAsyncHandler(async (req, res) => {
  try {
    const sellerProfile = await sellerModel.findOne({ ownerId: req.user._id });
    if (!sellerProfile) {
      return res.status(200).send({
        message: locals.you_are_not_seller,
        success: false,
        data: null,
      });
    }

    const filter = req.query.filter || '1W';
    const sellerId = sellerProfile._id;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const getStartDate = (unit, value) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      switch (unit) {
        case 'days':
          date.setDate(date.getDate() - value);
          break;
        case 'months':
          date.setMonth(date.getMonth() - value);
          break;
        case 'years':
          date.setFullYear(date.getFullYear() - value);
          break;
      }
      return date;
    };

    let unit = 'days';
    let value = 7;
    let durationLabel = 'daily';
    let groupBy = 'day';
    let groupLabels = [];

    switch (filter) {
      case '1W':
        unit = 'days';
        value = 7;
        groupBy = 'day';
        durationLabel = 'daily';
        break;
      case '1M':
        unit = 'days';
        value = 28; // 4 weeks
        groupBy = 'custom-week';
        durationLabel = 'weekly';
        groupLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        break;
      case '3M':
        unit = 'months';
        value = 3;
        groupBy = 'month';
        durationLabel = 'monthly';
        break;
      case '6M':
        unit = 'months';
        value = 6;
        groupBy = 'month';
        durationLabel = 'monthly';
        break;
      case '1Y':
        unit = 'months';
        value = 12;
        groupBy = 'month';
        durationLabel = 'monthly';
        break;

      case '5Y':
        unit = 'years';
        value = 5;
        groupBy = 'year';
        durationLabel = 'yearly';
        break;
    }

    const currentStart = getStartDate(unit, value);
    const previousStart = getStartDate(unit, value * 2);

    // Pipeline for MongoDB Aggregation
    const pipeline = [
      {
        $match: {
          sellerId,
          createdAt: { $gte: previousStart, $lte: today },
        },
      },
      {
        $addFields: {
          week: {
            $cond: [
              { $gte: ['$createdAt', currentStart] },
              'current',
              'previous',
            ],
          },
        },
      },
    ];

    // Grouping logic based on filter
    if (groupBy === 'day') {
      pipeline.push({
        $addFields: {
          label: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      });
    } else if (groupBy === 'month') {
      pipeline.push({
        $addFields: {
          label: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
        },
      });
    } else if (groupBy === 'year') {
      pipeline.push({
        $addFields: {
          label: {
            $dateToString: { format: '%Y', date: '$createdAt' },
          },
        },
      });
    } else if (groupBy === 'custom-week') {
      pipeline.push(
        {
          $addFields: {
            dayDiff: {
              $dateDiff: {
                startDate: currentStart,
                endDate: '$createdAt',
                unit: 'day',
              },
            },
          },
        },
        {
          $addFields: {
            label: {
              $concat: [
                'Week ',
                {
                  $toString: {
                    $add: [
                      { $floor: { $divide: ['$dayDiff', 7] } },
                      1,
                    ],
                  },
                },
              ],
            },
          },
        }
      );
    } else if (groupBy === 'month') {
      const labels = [];
      const date = new Date(today);

      // Go to first day of current month
      // date.setDate(1);
      copy.setMonth(copy.getMonth() - i);


      // Don't include current month if today is not last day
      const includeCurrentMonth = (() => {
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(0); // last day of current month
        return today.getDate() === nextMonth.getDate();
      })();

      const monthsToInclude = includeCurrentMonth ? value : value - 1;

      for (let i = monthsToInclude - 1; i >= 0; i--) {
        const copy = new Date(date);
        copy.setMonth(copy.getMonth() - i);
        const key = `${copy.getFullYear()}-${String(
          copy.getMonth() + 1
        ).padStart(2, '0')}`;
        labels.push(key);
      }
      return labels;
    }

    pipeline.push({
      $group: {
        _id: { week: '$week', label: '$label' },
        itemsSold: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [{ $ifNull: ['$buyerId', false] }, '$price', 0],
          },
        },
      },
    });

    const results = await sellerTransactionModel.aggregate(pipeline);

    // Generate labels
    const generateLabels = () => {
      if (groupBy === 'day') {
        const labels = [];
        for (let i = value - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          labels.push(d.toISOString().split('T')[0]);
        }
        return labels;
      } else if (groupBy === 'month') {
        const labels = [];
        const date = new Date(today);
        date.setDate(1); // Start at the first day of the current month

        for (let i = value - 1; i >= 0; i--) {
          const copy = new Date(date);
          copy.setMonth(copy.getMonth() - i);
          const key = `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}`;
          labels.push(key);
        }

        return labels;
      } else if (groupBy === 'year') {
        const labels = [];
        const date = new Date(today);
        for (let i = value - 1; i >= 0; i--) {
          const year = date.getFullYear() - i;
          labels.push(String(year));
        }
        return labels;
      } else if (groupBy === 'custom-week') {
        return groupLabels;
      }
    };


    const labels = generateLabels();

    const initialMap = () => ({
      revenue: labels.reduce((acc, label) => ((acc[label] = 0), acc), {}),
      items: labels.reduce((acc, label) => ((acc[label] = 0), acc), {}),
    });

    const weekData = {
      current: initialMap(),
      previous: initialMap(),
    };

    results.forEach((r) => {
      const label = r._id.label;
      const group = weekData[r._id.week];
      if (group && group.revenue[label] !== undefined) {
        group.revenue[label] = r.totalRevenue;
        group.items[label] = r.itemsSold;
      }
    });

    const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

    const totalRevenue = sum(weekData.current.revenue);
    const prevRevenue = sum(weekData.previous.revenue);
    const revenueChange =
      prevRevenue === 0
        ? 100
        : ((totalRevenue - prevRevenue) / prevRevenue) * 100;

    const totalItems = sum(weekData.current.items);
    const prevItems = sum(weekData.previous.items);
    const itemChange =
      prevItems === 0 ? 100 : ((totalItems - prevItems) / prevItems) * 100;

    return res.status(200).json({
      success: true,
      message: locals.list,
      data: {
        revenue: {
          total: totalRevenue,
          changePercent: parseFloat(revenueChange.toFixed(2)),
          // [durationLabel]: weekData.current.revenue,
          "monthly": weekData.current.revenue,
        },
        itemsSold: {
          total: totalItems,
          changePercent: parseFloat(itemChange.toFixed(2)),
          // [durationLabel]: weekData.current.items,
          "monthly": weekData.current.items,
        },
      },
    });
  } catch (err) {
    return res
      .status(400)
      .json({ message: locals.server_error, success: false, data: null });
  }
});

const getDemographicsOverview = expressAsyncHandler(async (req, res) => {
  const { type = 'city', filter = '1W' } = req.query; // Options: gender | age | city

  try {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Function to calculate start date based on the filter
    const getStartDate = () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      switch (filter) {
        case '1W':
          date.setDate(date.getDate() - 7);
          break;
        case '1M':
          date.setDate(date.getDate() - 28); // Approx. 4 weeks
          break;
        case '3M':
          date.setMonth(date.getMonth() - 3);
          break;
        case '6M':
          date.setMonth(date.getMonth() - 6);
          break;
        case '1Y':
          date.setFullYear(date.getFullYear() - 1);
          break;
        case '5Y':
          date.setFullYear(date.getFullYear() - 5);
          break;
        default:
          break;
      }
      return date;
    };

    const startDate = getStartDate();

    // Filter documents within time range and valid demographic field
    const matchQuery = {
      createdAt: { $gte: startDate, $lte: now },
    };

    const total = await sellerTransactionModel.countDocuments(matchQuery);
    console.log('total ', total);

    const results = await sellerTransactionModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: `$${type}`,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          label: '$_id',
          count: 1,
          percentage: {
            $cond: [
              { $eq: [total, 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$count', total] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { percentage: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: locals.list,
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Something went wrong' });
  }
});

export {
  register,
  verifyAadharOTP,
  getProfile,
  followUnfollowSeller,
  sellingAnalytics,
  addWithdrwalRequest,
  wallet,
  getDemographicsOverview,
};

//Function for verify adhara card
async function sendAadharOTP(aadharNumber) {
  try {
    if (!aadharNumber || aadharNumber.length !== 12) {
      return res.status(400).json({ message: 'Invalid Aadhar number' });
    }
    const response = await axios.post(
      `${AADHAR_API_URL}/send-otp`,
      {
        aadharNumber,
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    return response.data.txnId;
  } catch (error) {
    return null;
  }
}
