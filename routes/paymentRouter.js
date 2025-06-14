import express from "express";
const paymentRouter = express.Router();
import verifyUser from "../middleware/rbac.js";
paymentRouter.use(verifyUser());
import {
    addPaymentMethode, paymentMethodeList, editPaymentMethode, createOrder, orderList, orderPaymentSave,
    getShippingCharges, orderStatusUpdateBySeller,deletePaymentMethode,orderStatusUpdateByBuyer
} from "../controllers/shop/paymentCon.js";

paymentRouter.post("/addPaymentMethod", addPaymentMethode);
paymentRouter.get("/paymentMethodList", paymentMethodeList);
paymentRouter.put("/editPaymentMethod", editPaymentMethode);
paymentRouter.delete("/deletePaymentMethode/:id", deletePaymentMethode);

paymentRouter.post("/getShippingCharges", getShippingCharges);
paymentRouter.post("/createOrder", createOrder);
paymentRouter.post("/orderPaymentSave", orderPaymentSave);
paymentRouter.get("/orderList/:type", orderList);
paymentRouter.put("/orderStatusUpdateBySeller",orderStatusUpdateBySeller);
paymentRouter.put("/orderStatusUpdateByBuyer",orderStatusUpdateByBuyer);
export default paymentRouter;