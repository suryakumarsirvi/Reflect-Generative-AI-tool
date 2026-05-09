import {Schema, model} from 'mongoose';

const UserSchema = new Schema({
    fullname: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: function(){
            !this.provider === 'google'
        },
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    refreshToken:{
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const UserModel = model('users', UserSchema);

export default UserModel;