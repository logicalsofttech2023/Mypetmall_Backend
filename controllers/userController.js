import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import generateOtp from "../utils/generateOtp.js";

export const registerUser = async (req, res) => {
  const {
    name,
    userEmail,
    password,
    phone,
    role,
    education,
    experience,
    college,
    specialization,
    licenseNumber,
    clinicAddress,
    availableDays,
    timings,
    consultationFee,
  } = req.body;

  try {
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.isVerified) {
      res.status(400);
      return res.status(400).json({
        success: false,
        message: "User already exists and is verified.",
      });
    }

    const profilePicture = req.files?.profilePicture
      ? req.files.profilePicture[0].path.replace(/\\/g, "/")
      : "";

    const documents =
      req.files?.documents?.map((file) => file.path.replace(/\\/g, "/")) || [];

    const otp = await generateOtp(4);

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    const doctorFields =
      role === "doctor"
        ? {
            education,
            experience,
            college,
            specialization,
            licenseNumber,
            clinicAddress,
            availableDays,
            timings,
            consultationFee,
            documents,
          }
        : {};

    if (existingUser) {
      existingUser.name = name;
      existingUser.userEmail = userEmail;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.isVerified = false;
      existingUser.role = role || "user";
      existingUser.profilePicture = profilePicture;

      Object.assign(existingUser, doctorFields);

      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        profilePicture,
        userEmail,
        phone,
        password: hashedPassword,
        otp,
        isVerified: false,
        role: role || "user",
        ...doctorFields,
      });
    }

    res.status(200).json({ message: "OTP sent successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      message: "OTP verified successfully",
      token: generateToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
    console.error(error);
  }
};

export const resendOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is already verified" });
    }

    const newOtp = await generateOtp(4);
    user.otp = newOtp;
    await user.save();

    res.status(200).json({ message: "OTP resent successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loginUser = async (req, res, next) => {
  const { identifier, password } = req.body;
  console.log();

  try {
    const user = await User.findOne({
      $or: [{ phone: identifier }, { userEmail: identifier }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is not verified. Please complete OTP verification.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user),
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res) => {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing in the request" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, userEmail, phone } = req.body;
    const profilePicture = req.files?.profilePicture
      ? req.files.profilePicture[0].path.replace(/\\/g, "/")
      : "";
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.userEmail = userEmail || user.userEmail;
    user.phone = phone || user.phone;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
