import { Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface IUser {
    name: string
    branch: string
    rollNo: string
    section: string
    domain: string
    studentNo: string
    present: boolean
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    rollNo: {
        type: String,
        trim: true,
        required: true
    },
    studentNo: {
        type: String,
        trim: true,
        required: true
    },
    section: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        required: true,
        trim: true
    },
    present: {
        type: Boolean,
        default: false,
        trim: true
    },
});

export default model<IUser>("Event Member", UserSchema);
