import expressAsyncHandler from "express-async-handler";
import UserModel from "../../models/userModel.js";
import EmailVerificationModel from "../../models/emailVerifyModel.js";
import SellerModel from "../../models/sellerModel.js";
import AddressModel from "../../models/addressModel.js";
import TicketModel from "../../models/resolutionConter.js";

const updatePreference = expressAsyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, type, id } = req.body;

        if (!status || !type || !id) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }
        const fieldMap = {
            brand: 'brandIds',
            style: 'styleIds',
            size: 'sizes',
        };

        const field = fieldMap[type];
        if (!field) {
            return res.status(200).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null
            });
        }

        const update =
            status === 'add'
                ? { $addToSet: { [field]: id } } // add only if not already in array
                : { $pull: { [field]: id } }; // remove from array

        const updatedUser = await UserModel.findByIdAndUpdate(userId, update, { new: true });
        return res.status(200).send({ message: locals.update, success: true, data: updatedUser });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: error });
    }
});

//update profile
const updateProfile = expressAsyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { email, phoneNumber, bio, password, username, onlyFollowUserSendMessage, isAdvertisementAllow, isSiteCustomizationAllow } = req.body;
        if (email)
            await EmailVerificationModel.deleteOne({ email: req.user.email });
        if (password) req.body.password = await bcrypt.hash(password, 10);
        if (bio) await SellerModel.updateOne({ ownerId: req.user._id }, { $set: { bio: bio } });
        if (username) req.body.lastUsernameChangeDate = new Date().setDate(new Date().getDate() + 30)
        const updatedUser = await UserModel.findByIdAndUpdate(userId, req.body);
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: error });
    }
});

const addressAdd = expressAsyncHandler(async (req, res) => {
    try {
        const { type, location, latitude, longititude, pinCode, address, landmark, houseNumber } = req.body;
        // if (![type, location, latitude, longititude,].every(Boolean)) {
        //     return res.status(400).send({
        //         message: locals.enter_all_filed,
        //         success: false,
        //         data: null,
        //     });
        // }
        req.body.userId = req.user._id
        await AddressModel.create(req.body);
        return res.status(200).send({ message: locals.record_create, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addressList = expressAsyncHandler(async (req, res) => {
    try {
        let data = await AddressModel.find({ userId: req.user._id });
        return res.status(200).send({ message: locals.record_fetch, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const addressEdit = expressAsyncHandler(async (req, res) => {
    try {
        const { type, location, latitude, longititude, pinCode, address, landmark, houseNumber, id } = req.body;
        if (![id].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null,
            });
        }
        await AddressModel.updateOne({ _id: id }, {
            $set: req.body
        });
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});


const addressRemove = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (![id].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_filed,
                success: false,
                data: null,
            });
        }
        await AddressModel.deleteOne({ _id: id });
        return res.status(200).send({ message: locals.record_delete, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const ticketAdd = expressAsyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;
        if (![title, description].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null,
            });
        }
        req.body.userId = req.user._id
        let data = await TicketModel.create(req.body);
        return res.status(200).send({ message: locals.record_create, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const ticketList = expressAsyncHandler(async (req, res) => {
    try {
        let data = await TicketModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).send({ message: locals.list, success: true, data: data });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

const ticketEdit = expressAsyncHandler(async (req, res) => {
    try {
        const { type, location, latitude, longititude, pinCode, ticket, landmark, houseNumber, id } = req.body;
        if (![id].every(Boolean)) {
            return res.status(400).send({
                message: locals.enter_all_fileds,
                success: false,
                data: null,
            });
        }
        await ticketModel.updateOne({ _id: id }, {
            $set: req.body
        });
        return res.status(200).send({ message: locals.record_edit, success: true, data: null });
    } catch (error) {
        return res.status(400).send({ message: locals.server_error, success: false, data: null });
    }
});

export { updatePreference, updateProfile, addressAdd, addressList, addressEdit, addressRemove, ticketAdd, ticketList }