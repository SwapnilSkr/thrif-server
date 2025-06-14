import admin from "../config/firebase.js";
import userToken from "../models/userTokenModel.js";
import notification from "../models/notificationModel.js";

const saveAndSendNotification = async (req, res) => {
    try {
        const { notificationType, userId } = req.body;
        req.body.userIds = []
        if (notificationType == "followSeller") {
            req.body.userIds = [userId];
            req.body.message = locals.follow_notification.replace('%NAME%', req.body.name);
        }
        if (notificationType == "offerReceive") {
            req.body.userIds = [userId];
            req.body.message = locals.receives_offer_notification;
        }
        if (notificationType == "offerAccept") {
            req.body.userIds = [userId];
            req.body.message = locals.accept_offer_notification;
        }
        if (notificationType == "offerCancel") {
            req.body.userIds = [userId];
            req.body.message = locals.cancel_offer_notification;
        }
        await sendNotification(req, res)
    } catch (error) {

    }
}

async function sendNotification(req, res) {
    try {
           // let data = {
        //     carpoolId: carPoolData?.dataValues.id,
        //     carpoolName: carPoolData?.dataValues.activityName,
        //     carpoolImage: carPoolData?.dataValues.carPoolImageUrl,
        //     tripId: req.body.actionId
        // }
        // req.body.jsonString = JSON.stringify(data);
        const msg = {
            notification: { title: "Thrif", body: req.body.message },
            token: "",
            data: { clickAction: req.body.notificationType },// customData: JSON.stringify(data),
            android: { priority: "high" },
            apn: { payload: { aps: { 'content-available': 1 } } }
        };
        for (let item of req.body.userIds) {
            const token = await userToken.findOne({ userId: item, deviceToken: { $ne: null } });
            if (token) {
                msg.token = token;
                await admin.messaging().send(msg);
            }
            req.body.userId =item
            req.body.payload =msg.notification
            await notification.create(req.body);
        }
    } catch (error) {
        console.log(error);
    }
}

const sendChatNotification = async (req,res) => {
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.msgText
        },
        token: req.body.token,  // The recipient's device token
        data: {
            customData: req.body.jsonString,
            clickAction: req.body.clickAction // Redirection action for client app
        },
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    'content-available': 1,
                }
            }
        }
    };
    await admin
        .messaging()
        .send(message)
        .then((response) => {
            console.log("Notification Send Success ===> ", response);
            // return res.status(200).send("Notification sent successfully");
        })
        .catch((error) => {
            console.error("Send Notification Error ===> ", error);
        });
};
export { saveAndSendNotification,sendChatNotification }