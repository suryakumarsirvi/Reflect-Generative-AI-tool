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
    },
    tier: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    preferences: {
        tone: {
            type: String,
            enum: ['neutral', 'technical', 'simple'],
            default: 'neutral'
        },
        interest_tags: {
            type: [String],
            default: ['AI', 'backend', 'finance']
        },
        search_style: {
            type: String,
            enum: ['fast', 'deep'],
            default: 'fast'
        }
    },
    history_summary: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

const UserModel = model('users', UserSchema);

export default UserModel;