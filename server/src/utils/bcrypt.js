import bcrypt from 'bcryptjs';

export const generateHash = async(value, salt = 10)=>{
    return await bcrypt.hash(value, salt);
}

export const verifyHash = async(plainValue, hashValue)=>{
    return await bcrypt.compare(plainValue, hashValue);
}