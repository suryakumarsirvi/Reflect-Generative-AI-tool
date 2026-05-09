import UserSchema from "../models/user.model.js";
import logger from "../configs/logger.config.js";
import * as UserRepository from "../repository/user.repository.js";
import { generateHash, verifyHash } from "../utils/bcrypt.js";
import { CONFIG } from "../configs/env.config.js";
import { generateToken } from "../utils/jwt.js";

export const handleRegister = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    const isExist = await UserRepository.findByEmail(email);

    if (isExist) {
      return res.status(409).json({
        success: false,
        message: "Email already exist, Try Login",
      });
    }

    const hashPassword = await generateHash(password);

    const newUser = {
      fullname,
      email,
      password: hashPassword,
    };

    const user = await UserRepository.CreateUser(newUser);

    const accessToken = generateToken(user._id, "15m");
    const refreshToken = generateToken(user._id, "7d");
    const hashedToken = await generateHash(refreshToken);

    user.refreshToken = hashedToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        email: user.email,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: "Error while register",
      error: error.message,
    });
  }
};

export const handleLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const isExist = await UserRepository.findByEmail(email);

    if (!isExist) {
      return res.status(409).json({
        success: false,
        message: "User not found",
      });
    }

    const validPassword = await verifyHash(password, isExist.password);

    const accessToken = generateToken(user._id, "15m");
    const refreshToken = generateToken(user._id, "7d");
    const hashedToken = await generateHash(refreshToken);

    isExist.refreshToken = hashedToken;
    await isExist.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(201).json({
      success: true,
      message: "User loggedIn successfully",
      data: {
        id: user._id,
        email: user.email,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: "Error while login",
      error: error.message,
    });
  }
};

export const handleGoogleAuth = async (req, res) => {
    try {
        const {
            displayName,
            emails,
            photos
        } = req.user;

        const email = emails?.[0]?.value;
        const profilePicture = photos?.[0]?.value;

        let user = await UserRepository.findByEmail(email);

        if (!user) {

            const newUser = {
                fullname: displayName,
                email,
                profilePicture,
                provider: 'google'
            };

            user = await UserRepository.createUser(newUser);
        }

        const accessToken = generateToken(user._id, "15m");

        const refreshToken = generateToken(user._id, "7d");

        const hashedToken = await generateHash(refreshToken);

        user.refreshToken = hashedToken;

        await user.save();

        const redirectURL =
            `http://localhost:5173/google/callback` +
            `?accessToken=${accessToken}` +
            `&name=${encodeURIComponent(user.fullname)}` +
            `&email=${encodeURIComponent(user.email)}` +
            `&profilePicture=${encodeURIComponent(user.profilePicture || '')}`;

        return res.redirect(redirectURL);

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Error in Google Auth",
            error: error.message
        });
    }
};

export const handleLogout = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserRepository.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.refreshToken = null;

        await user.save();

        res.clearCookie('accessToken');

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Error while logout",
            error: error.message
        });
    }
};

export const handleGetMe = async (req, res) => {

    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: req.user
    });
}
