import UserModel from "../models/user.model.js"

export const findByEmail = async(email)=>{
    return await UserModel.findOne({email});
}

export const findById = async(id)=>{
    return await UserModel.findById(id).select('-password -refreshToken');
}

export const CreateUser = async(data)=>{
    return await UserModel.create(data);
}