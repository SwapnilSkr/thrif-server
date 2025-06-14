import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js"; // Assuming your user model is in models/User.js
import Admin from "../models/adminModel.js";
// Middleware for RBAC
const verifyUser = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        // Extract token
        token = req.headers.authorization.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user by decoded ID
        if (decoded.role == "user") {
          req.user = await User.findById(decoded.id)//.select("-password");
        } else {
          req.user = await Admin.findById(decoded.id)//.select("-password");
        }
        // If specific roles are defined, check if user role is authorized
        if (roles.length && !roles.includes(req.user.role)) {
          return res.status(403).json({ message: "Forbidden: Access is denied" });
        }
        // Proceed to next middleware
        next();
      } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
      }
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  });
};


export default verifyUser;
