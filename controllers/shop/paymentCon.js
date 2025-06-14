import expressAsyncHandler from "express-async-handler";
import paymentMethod from "../../models/paymentMethodModel.js";
import order from "../../models/orderModel.js";
import orderProduct from "../../models/orderProductModel.js";
import productModel from "../../models/productModel.js";
import productVarientItemsModel from "../../models/productVarientItemModel.js";
import productVarientModel from "../../models/productVarientModel.js";
import sellerModel from "../../models/sellerModel.js";
import Cart from "../../models/cartModel.js";
import Razorpay from "razorpay";
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addPaymentMethode = expressAsyncHandler(async (req, res) => {
    try {
        const { methodeType, paymentType, paymentId, id } = req.body;
        if (![methodeType, paymentType, paymentId].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        req.body.userId = req.user._id
        await paymentMethod.create(req.body);
        return res.status(200).send({ message: locals.record_create, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const paymentMethodeList = expressAsyncHandler(async (req, res) => {
    try {
        let data = await paymentMethod.find({ userId: req.user._id, });
        return res.status(200).send({ message: locals.list, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const editPaymentMethode = expressAsyncHandler(async (req, res) => {
    try {
        const { id, isDefault } = req.body;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        if (isDefault) await paymentMethod.updateOne({ _id: id }, { $set: { isDefault: false } });
        await paymentMethod.updateOne({ _id: id }, { $set: req.body });
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const deletePaymentMethode = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        await paymentMethod.deleteOne({ _id: id });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const getShippingCharges = expressAsyncHandler(async (req, res) => {
    try {

        const { sellerIds, deliveryAddressId } = req.body;
        if (![deliveryAddressId, sellerIds].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let data = [];
        sellerIds.map((item) => {
            data.push({
                sellerId: item,
                deliveryBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                expresSshippingCharges: 198
            })
        })
        return res.status(200).send({ message: locals.record_edit, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const createOrder = expressAsyncHandler(async (req, res) => {
    try {
        const { currency = 'INR', totalBillAmt, paymentType, totalShippingCharges, deliveryAddressId, products } = req.body;
        if (![totalBillAmt, paymentType, totalShippingCharges, deliveryAddressId, products].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }

        let sellerIds = []
        // let sellerIds = new Set();
        // req.body.history = {
        //     date: new Date(),
        //     status: "orderReceived",
        //     userBy: "buyer",
        //     sellerId: ""
        // }
        req.body.userId = req.user._id
        req.body.orderId = await generateCustomOrderId()
        let orderData = await order.create(req.body);
        req.body.orderId = orderData._id

        await Promise.all(products.map(async (item) => {
            if (!sellerIds.includes(item.sellerId)) sellerIds.push(item.sellerId);
            //  sellerIds.add(item.sellerId);
            let productVarientItemIds = []
            let productVarientItemSerialNumbers = []
            for (let i = 0; i < item.quantity; i++) {
                let productVarientItem = await productVarientItemsModel.findOne({
                    productId: item.productId,
                    productVarientId: item.productVarientId,
                    status: "available",
                    _id: { $nin: productVarientItemIds }
                });
                productVarientItemIds.push(productVarientItem._id)
                productVarientItemSerialNumbers.push(productVarientItem.serialNumber)
            }
            item.productVarientItemId = productVarientItemIds //productVarientItem._id;
            item.productSerialNumber = productVarientItemSerialNumbers//productVarientItem.serialNumber;
            item.orderId = orderData._id
            item.userId = req.user._id
            item.deliveryProgress = deliveryProgress
            item.acceptedShipingTime = new Date().setDate(new Date().getDate() + 2);
            // {
            //     date: new Date(),
            //     status: "orderReceived",
            //     sellerId: item.sellerId,
            //     buyerId: item.userId
            // }
            await orderProduct.create(item);
        }));
        if (paymentType === "cash") {
            let orderProducts = await orderProduct.find({ orderId: orderData._id });
            orderProducts.map(async (item) => {
                await productVarientItemsModel.updateMany({ _id: { $in: item.productVarientItemId }, }, { $set: { status: "sold" } });
                await productVarientModel.updateOne({ _id: item.productVarientId }, { $inc: { availableQuantity: - item.quantity } });
                await productModel.updateOne({ _id: item.productId }, { $inc: { totalItems: - item.quantity } });
                await Cart.deleteOne({ userId: req.user._id, productId: item.productId });
            });
            const arrivingBy = await Promise.all(
                orderData.sellerIds.map(async (item) => {
                    const orderProducts = await orderProduct
                        .findOne({ orderId: orderData._id, sellerId: item })
                        .populate("sellerId");
                    return {
                        sellerId: item,
                        sellerName: orderProducts?.sellerId?.name || "N/A",
                        arrivingDate: orderProducts?.arrivingBy || null,
                    };
                })
            );
            await order.updateOne({ _id: orderData._id }, {
                $set: {
                    paymentStatus: "completed",
                    sellerIds
                }
            });
            let updatedOrderData = await order.findOne({ _id: orderData._id });

            return res.status(200).send({
                message: locals.payment_staus_save,
                success: true,
                data: {
                    ...updatedOrderData._doc,
                    paymentBy: req.user.username,
                    arrivingBy: arrivingBy
                }
            });
        }
        if (paymentType === "online") {
            req.body.customer_id = req.user.razorpayCustomerId;
            req.body.receipt = orderData._id;
            req.body.amount = totalBillAmt * 100;
            const razorpayOrder = await createRazorpayOrder(req);
            req.body.razorpayOrderId = razorpayOrder.id;
        }
        await order.updateOne({ _id: orderData._id }, {
            $set: {
                sellerIds, razorpayOrderId: req.body.razorpayOrderId
            }
        })
        let updatedOrderData = await order.findOne({ _id: orderData._id });

        return res.status(200).send({
            message: locals.record_create,
            success: true,
            data: updatedOrderData
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

const orderPaymentSave = expressAsyncHandler(async (req, res) => {
    try {
        const { orderId, paymentId, signature, paymentStatus } = req.body;
        if (![orderId, paymentStatus].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let orderData = await order.findOne({ razorpayOrderId: orderId });
        if (!orderData) {
            return res.status(200).send({
                message: locals.valid_id,
                success: false,
                data: null
            });
        }
        if (paymentStatus == "fail") {
            await orderProduct.deleteMany({ orderId: orderData._id });
            await order.updateOne({ _id: orderData._id }, {
                $set: {
                    paymentStatus: "failed", status: "paymentFailed"
                }
            });
            return res.status(200).send({
                message: locals.payment_staus_save,
                success: true,
                data: null
            });
        } else {
            // let arrivingBy = []
            let orderProducts = await orderProduct.find({ orderId: orderData._id });
            orderProducts.map(async (item) => {
                await productVarientItemsModel.updateMany({ _id: { $in: item.productVarientItemId }, }, { $set: { status: "sold" } });
                await productVarientModel.updateOne({ _id: item.productVarientId }, { $inc: { availableQuantity: - item.quantity } });
                await productModel.updateOne({ _id: item.productId }, { $inc: { totalItems: - item.quantity } });
                await Cart.deleteOne({ userId: req.user._id, productId: item.productId });
            });
            let cardss = await saveCardFromRazorpay(req);
            console.log("cardss ", cardss);

            const arrivingBy = await Promise.all(
                orderData.sellerIds.map(async (item) => {
                    const orderProducts = await orderProduct
                        .findOne({ orderId: orderData._id, sellerId: item })
                        .populate("sellerId");
                    return {
                        sellerId: item,
                        sellerName: orderProducts?.sellerId?.name || "N/A",
                        arrivingDate: orderProducts?.arrivingBy || null,
                    };
                })
            );

            await order.updateOne({ _id: orderData._id }, {
                $set: {
                    paymentStatus: "completed", paymentId, paymentSignature: signature
                }
            });
            let updatedOrderData = await order.findOne({ _id: orderData._id });

            return res.status(200).send({
                message: locals.payment_staus_save,
                success: true,
                data: {
                    ...updatedOrderData._doc,
                    paymentBy: req.user.username,
                    arrivingBy: arrivingBy
                }
            });
        }

    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

const orderList = expressAsyncHandler(async (req, res) => {
    try {
        const { type } = req.params;
        if (![type].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        let condition = { userId: req.user._id }
        let sellerId
        if (type == "seller") {
            let seller = await sellerModel.findOne({ ownerId: req.user._id });
            if (!seller) {
                return res.status(200).send({
                    message: locals.you_are_not_seller,
                    success: false,
                    data: null
                });
            }
            condition = { sellerIds: { $in: [seller._id] } }
            sellerId = seller._id
        }
        condition.status = { $nin: ["paymentFailed"] }
        let orderData = await order.aggregate([
            { $match: condition },
            // Get orderProducts
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                            }
                        }
                    ]
                }
            },
            // Get orderProducts
            {
                $lookup: {
                    from: 'orderproducts',
                    localField: '_id',
                    foreignField: 'orderId',
                    as: "orderProducts"
                }
            },
            // Get delivery address
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'deliveryAddressId',
                    foreignField: '_id',
                    as: "address"
                }
            },
            {
                $unwind: {
                    path: '$address',
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Unwind orderProducts for individual lookups
            {
                $unwind: {
                    path: "$orderProducts",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup product details for each product
            {
                $lookup: {
                    from: "products",
                    localField: "orderProducts.productId",
                    foreignField: "_id",
                    as: "orderProducts.productDetails",
                    pipeline: [
                        ...(type === "seller" ? [{ $match: { sellerId: sellerId } }] : []),
                        {
                            $project: {
                                _id: 1,
                                userId: 1,
                                sellerId: 1,
                                title: 1,
                                description: 1,
                                images: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$orderProducts.productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup variant details
            {
                $lookup: {
                    from: "productvarients",
                    localField: "orderProducts.productVarientId",
                    foreignField: "_id",
                    as: "orderProducts.productVarientDetails"
                }
            },
            {
                $unwind: {
                    path: "$orderProducts.productVarientDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup variant items details
            {
                $lookup: {
                    from: "productvarientitems",
                    localField: "orderProducts.productVarientItemId",
                    foreignField: "_id",
                    as: "orderProducts.productVarientItems"
                }
            },
            // Group back by order and push enriched orderProducts
            {
                $group: {
                    _id: "$_id",
                    orderDetails: { $first: "$$ROOT" },
                    orderProducts: { $push: "$orderProducts" }
                }
            },

            // Replace root to merge and clean structure
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$orderDetails", { orderProducts: "$orderProducts" }]
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);
        return res.status(200).send({
            message: locals.list,
            success: true,
            data: orderData
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

const orderStatusUpdateBySeller = expressAsyncHandler(async (req, res) => {
    try {
        const { orderId, status, orderProductId } = req.body;
        if (![orderId, status, orderProductId].every(Boolean)) {
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
        let orderData = await order.findById(orderId);
        if (!orderData) {
            return res.status(200).send({
                message: locals.you_are_not_seller,
                success: false,
                data: null
            });
        }
        if (status == "cancel") {
            await orderProduct.updateOne(
                { orderId: orderId, sellerId: seller._id, _id: orderProductId },
                {
                    $set: {
                        status
                    }
                }
            );
            const totalCount = await orderProduct.countDocuments({ orderId });
            const cancelCount = await orderProduct.countDocuments({ orderId, status: "cancel" });
            const allCancel = totalCount > 0 && totalCount === cancelCount;
            if (allCancel)
                await order.updateOne(
                    { _id: orderId, },
                    {
                        $set: {
                            status: "cancel",
                        },
                    }
                );
        } else {
            await orderProduct.updateOne(
                { orderId: orderId, sellerId: seller._id, _id: orderProductId, "deliveryProgress.step": "prepare_for_shipment" },
                {
                    $set: {
                        "deliveryProgress.$.status": "completed",
                        "deliveryProgress.$.date": new Date(),
                        status
                    }
                }
            );
        }
        return res.status(200).send({
            message: locals.record_edit,
            success: true,
            data: null
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});

const orderStatusUpdateByBuyer = expressAsyncHandler(async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (![orderId, status].every(Boolean)) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            })
        }
        // let seller = await sellerModel.findOne({ ownerId: req.user._id });
        // if (!seller) {
        //     return res.status(200).send({
        //         message: locals.you_are_not_seller,
        //         success: false,
        //         data: null
        //     });
        // }
        let orderData = await order.findById(orderId);
        if (!orderData) {
            return res.status(200).send({
                message: locals.you_are_not_seller,
                success: false,
                data: null
            });
        }
        if (status == "cancel") {
            await order.updateOne(
                { _id: orderId },
                {
                    $set: {
                        status
                    }
                }
            );
            await orderProduct.updateOne(
                { orderId: orderId },
                {
                    $set: {
                        status
                    }
                }
            );
        }
        return res.status(200).send({
            message: locals.record_edit,
            success: true,
            data: null
        });
    } catch (error) {
        return res.status(400).json({ message: locals.server_error, success: false, data: null });
    }
});
async function createRazorpayOrder(req) {
    try {
        const { amount, currency = 'INR', receipt, customer_id } = req.body;

        const order = await razorpay.orders.create({
            amount: parseInt(amount),
            currency,
            receipt,
            customer_id,
        });
        return order
    } catch (error) {
        console.log("Razorpay Order Create Error ", error)
    }
}

function generateCustomOrderId() {
    const prefix = "THR";
    const randomPart1 = Math.floor(100000000 + Math.random() * 900000000); // 9-digit number
    const randomPart2 = Math.floor(100000 + Math.random() * 900000);       // 6-digit number
    return `${prefix}-${randomPart1}-${randomPart2}`;
}

async function saveCardFromRazorpay(req) {
    try {
        console.log("saveCardFromRazorpa ", req.paymentId);
        const cardDetails = await razorpay.payments.fetch(req.paymentId);
        console.log("cardDetails ", cardDetails)
        let saveData = {}
        if (cardDetails.method == "upi") {
            saveData = {
                userId: req.user._id,
                methodeType: "upi",
                paymentId: cardDetails.upi.vpa
            }
        }
        if (cardDetails.method == "card") {
            saveData = {
                userId: req.user._id,
                methodeType: "card",
                paymentType: cardDetails.card.network,
                issuer: cardDetails.card.issuer,
                type: cardDetails.card.type,
                paymentId: cardDetails.card.last4,
                razorpayTokenizedID: cardDetails.card.id,
            }
        }
        // const updatedSeller = await paymentMethod.findOneAndUpdate(
        //     { userId: req.user._id, paymentId: saveData.paymentId }, // filter
        //     { $set: saveData },                                      // update
        //     { new: true, upsert: true }                              // options
        // );
    } catch (error) {
        console.log("razorpay card error ", error)
    }
}
export { addPaymentMethode, paymentMethodeList, editPaymentMethode, createOrder, orderList, orderPaymentSave, getShippingCharges, orderStatusUpdateBySeller, deletePaymentMethode, orderStatusUpdateByBuyer }

const deliveryProgress = [
    {
        step: "order_received",
        title: {
            buyer: "Order received",
            seller: "Order received"
        },
        visibleTo: ["buyer", "seller"],
        status: "completed",
        // status: "pending",
        date: new Date(),
        expectedTime: null,
        meta: {}
    },
    {
        step: "prepare_for_shipment",
        title: {
            seller: "Prepare for shipment"
        },
        visibleTo: ["seller"],
        // status: "in_progress",
        status: "pending",
        date: null,
        expectedTime: null,
        meta: {}
    },
    {
        step: "shipped_by_seller",
        title: {
            buyer: "Shipped by the seller"
        },
        visibleTo: ["buyer"],
        status: "pending",
        date: null,
        expectedTime: null,
        meta: {}
    },
    {
        step: "shipment_local_hub",
        title: {
            buyer: "Shipment received at local hub",
            seller: "Shipment at local hub"
        },
        visibleTo: ["buyer", "seller"],
        status: "pending",
        date: null,
        expectedTime: null,
        meta: {}
    },
    {
        step: "out_for_delivery",
        title: {
            buyer: "Out for delivery",
            seller: "Out for delivery",
        },
        visibleTo: ["buyer", "seller"],
        status: "pending",
        date: null,
        expectedTime: null,
        meta: {
            deliveryContact: "9320381930"
        }
    },
    {
        step: "delivery_to_buyer",
        title: {
            seller: "Delivery to buyer",
            buyer: "Delivered"
        },
        visibleTo: ["seller", "buyer"],
        status: "pending",
        date: null,
        expectedTime: null,
        meta: {}
    }
]