import jwt from "jsonwebtoken";
import { CONFIG } from "../configs/env.config.js";

export const generateToken = (payload, expiry) => {
  return jwt.sign({ payload }, CONFIG.JWT_SECRET, { expiresIn: expiry });
};

export const verifyToken = (payload) =>{
    return jwt.verify({payload}, CONFIG.JWT_SECRET);
};
