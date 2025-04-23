import express from "express";
import {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    getUserById,
    updateUser
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadFields } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/registerUser",uploadFields, registerUser);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.post("/loginUser", loginUser);
router.get("/getUserById", authMiddleware, getUserById);
router.post("/updateUser",uploadFields, authMiddleware, updateUser);

export default router;
