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

    const cookieOptions = {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

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

    const accessToken = generateToken(isExist._id, "15m");
    const refreshToken = generateToken(isExist._id, "7d");
    const hashedToken = await generateHash(refreshToken);

    isExist.refreshToken = hashedToken;
    await isExist.save();

    const cookieOptions = {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(201).json({
      success: true,
      message: "User loggedIn successfully",
      data: {
        id: isExist._id,
        email: isExist.email,
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

            user = await UserRepository.CreateUser(newUser);
        }

        const accessToken = generateToken(user._id, "15m");

        const refreshToken = generateToken(user._id, "7d");

        const hashedToken = await generateHash(refreshToken);

        user.refreshToken = hashedToken;

        await user.save();

        const cookieOptions = {
          httpOnly: true,
          secure: CONFIG.NODE_ENV === "production",
          sameSite: "lax",
        };

        res.cookie("accessToken", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

        const redirectURL = `${CONFIG.CLIENT_URL}/google/callback`;

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
        res.clearCookie('refreshToken');

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

export const handleRefresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const user = await UserRepository.findById(decoded.id);

    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: "User not found or invalid session" });
    }

    const isValid = await verifyHash(refreshToken, user.refreshToken);

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const newAccessToken = generateToken(user._id, "15m");
    const newRefreshToken = generateToken(user._id, "7d");
    const hashedToken = await generateHash(newRefreshToken);

    user.refreshToken = hashedToken;
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
    };

    res.cookie("accessToken", newAccessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal server error during refresh" });
  }
};

export const handleGetMe = async (req, res) => {

    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: req.user
    });
}

export const handleUpdateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullname, preferences } = req.body;

        const user = await UserRepository.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (fullname !== undefined) user.fullname = fullname;
        if (preferences !== undefined) {
            if (preferences.tone !== undefined) user.preferences.tone = preferences.tone;
            if (preferences.interest_tags !== undefined) user.preferences.interest_tags = preferences.interest_tags;
            if (preferences.search_style !== undefined) user.preferences.search_style = preferences.search_style;
        }

        await user.save();

        const updatedUser = await UserRepository.findById(userId);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

export const handleSubscribePro = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserRepository.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.tier = 'pro';
        await user.save();

        const updatedUser = await UserRepository.findById(userId);

        return res.status(200).json({
            success: true,
            message: "Successfully subscribed to Pro tier",
            data: updatedUser
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: "Error processing subscription",
            error: error.message
        });
    }
};
