import Admin from '../../models/adminModel.js';
import expressAsyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to generate JWT token
const refreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '60d' });
};

const login = expressAsyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required.' });
    }
    const user = await Admin.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        message: locals.login,
        success: true,
        data: {
          ...user._doc,
          accessToken: generateToken(user._id, 'admin'),
          refreshToken: refreshToken(user._id, 'admin'),
        },
      });
    } else {
      return res
        .status(200)
        .send({ message: locals.invalid_password, success: false, data: null });
    }
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

// const sendEmailOtp = expressAsyncHandler(async (req, res) => {
//     try {
//         const { email } = req.body;
//         const otp = 1234 //Math.floor(100000 + Math.random() * 900000);
//         // const subject = 'Email Verification OTP';
//         // const text = `Your OTP for verification is ${otp}`;
//         // const html = `<p>Your OTP for verification is <strong>${otp}</strong></p>`;
//         // Save OTP and session ID to the database
//         const user = await Admin.findOne({ email });
//         if (!user)
//             return res.status(200).json({ id: 0, message: "Invalid email or password" });

//         res.status(200).json({ id: 1, message: 'Email sent', sessionId });
//     } catch (error) {
//         res.status(400).json({ id: 0, message: 'Failed to send email', error: error.message });
//     }
// });
//Check email from email verify & send otp

const emailSendOtp = expressAsyncHandler(async (req, res) => {
  try {
    // Validate Request
    const { email } = req.body;
    if (![email].every(Boolean)) {
      res.status(200).send({
        message: locals.enter_email,
        success: false,
        data: null,
      });
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Check if user exists by email
    const existingUser = await Admin.findOne({ email });
    if (!existingUser)
      return res
        .status(200)
        .send({ message: locals.invalid_email, success: false, data: null });

    await Admin.updateOne(
      { email },
      {
        email_otp: 123456,
        email_verified: false,
      }
    );
    return res
      .status(200)
      .send({ message: locals.otp_send, success: true, data: null });
  } catch (error) {
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const verifyEmailOTP = expressAsyncHandler(async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (![email, otp].every(Boolean)) {
      res.status(200).send({
        message: locals.email_otp_required,
        success: false,
        data: null,
      });
    }
    // Find OTP entry
    const checkEmail = await Admin.findOne({ email });
    if (!checkEmail) {
      return res.status(200).send({
        message: locals.invalid_email,
        success: false,
        data: null,
      });
    }
    if (checkEmail.email_otp == otp) {
      await Admin.updateOne(
        { email },
        {
          email_otp: 0,
          email_verified: true,
        }
      );
      return res
        .status(200)
        .send({ message: locals.otp_verify, success: true, data: null });
    }
    return res
      .status(200)
      .send({ message: locals.valid_otp, success: false, data: null });
  } catch (error) {
    console.log(' ', error);
    return res
      .status(400)
      .send({ message: locals.server_error, success: false, data: null });
  }
});

const setPassword = expressAsyncHandler(async (req, res) => {
  try {
    // Validate Request
    const { email, password } = req.body;
    if (![email, password].every(Boolean)) {
      res.status(200).send({
        message: locals.enter_email,
        success: false,
        data: null,
      });
      return;
    }
    const existingUser = await Admin.findOne({ email });
    if (!existingUser)
      return res
        .status(200)
        .send({ message: locals.email_exists, success: false, data: null });

    if (existingUser.email_otp_verified == false)
      return res
        .status(200)
        .send({ message: locals.verify_otp, success: false, data: null });

    await Admin.updateOne(
      { email },
      {
        password: await bcrypt.hash(password, 10),
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

export { login, emailSendOtp, verifyEmailOTP, setPassword };
