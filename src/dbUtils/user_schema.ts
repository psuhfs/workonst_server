import mongoose from "mongoose";
import {Collections, DBCollection} from "../db/mongoDB.ts";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri ? uri : "", {
    dbName: DBCollection.STOCKON
});

const crewMemberSchema = new mongoose.Schema({
    uname: {type: String, required: true, unique: true},
    pw: {type: String, required: true},
    email: {type: String},
    zonalAccess: {type: [String], required: true},
    stockOnAccess: {type: [String], required: true},
}, {timestamps: true});


export async function createUser(uname: string, email: string, pw: string, zonalAccess: string[], stockOnAccess: string[]): Promise<boolean> {
    try {
        const newUser = new CREW_MEMBER({uname, email, pw, zonalAccess, stockOnAccess});
        await newUser.save();
        console.log("User created:", newUser);
        return true;
    } catch (error: any) {
        if (error.code === 11000) {
            console.error("Error: uname must be unique.");
        } else {
            console.error("Error creating user:", error);
        }
        return false;
    }
}

export async function getUserByUsername(uname: string, pw: string): Promise<any | undefined> {
    const user = await CREW_MEMBER.findOne({uname, pw});
    if (!user) {
        return undefined;
    }
    return user;
}

export async function modifyPassword(uname: string, oldPw: string, newPw: string): Promise<boolean> {
    try {
        // Find the user by username and old password
        const user = await CREW_MEMBER.findOne({ uname, pw: oldPw });

        if (!user) {
            return false; // User not found or incorrect password
        }

        // Update the password
        user.pw = newPw;

        // Save the updated user document
        await user.save();
        console.log("Password updated successfully.");
        return true; // Password updated successfully
    } catch (error: any) {
        console.error("Error updating password:", error);
        return false;
    }
}

export async function modifyAccess(uname: string, zonalAccess: string[], stockOnAccess: string[]): Promise<boolean> {
    try {
        // Find the user by username and old password
        const user = await CREW_MEMBER.findOne({ uname });

        if (!user) {
            return false; // User not found
        }

        user.zonalAccess = zonalAccess;
        user.stockOnAccess = stockOnAccess;

        // Save the updated user document
        await user.save();
        return true;
    } catch (error: any) {
        return false;
    }
}

export const CREW_MEMBER = mongoose.model(Collections.CREW_MEMBERS, crewMemberSchema);
