import { Types } from "mongoose";
import UserModel from "../models/user.model.js";
import { mapDatabaseError } from "../errors/database-error.utils.js";
export class MongoUserRepository {
    async findAllUsers() {
        try {
            const users = await UserModel.find()
                .select("_id email displayName status lastLoginAt createdAt updatedAt")
                .lean()
                .exec();
            return users.map(user => this.toUserType(user));
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async findById(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        try {
            const user = await UserModel.findById(userId)
                .select("_id email displayName status lastLoginAt createdAt updatedAt")
                .lean()
                .exec();
            if (!user) {
                return null;
            }
            return this.toUserType(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async findCredentialsByEmail(email) {
        try {
            const user = await UserModel.findOne({
                email: email.toLowerCase().trim(),
            })
                .select("_id email +passwordHash")
                .lean()
                .exec();
            if (!user) {
                return null;
            }
            if (!user.passwordHash) {
                return null;
            }
            return this.toUserCredentials(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async findCredentialsById(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        try {
            const user = await UserModel.findById(userId)
                .select("_id email +passwordHash")
                .lean()
                .exec();
            if (!user) {
                return null;
            }
            if (!user.passwordHash) {
                return null;
            }
            return this.toUserCredentials(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async create(data) {
        try {
            const user = await UserModel.create({
                email: data.email.toLowerCase().trim(),
                passwordHash: data.passwordHash,
                displayName: data.displayName,
                emailVerified: data.emailVerified ?? false,
                status: data.status ?? "pending",
                lastLoginAt: data.lastLoginAt,
            });
            return this.toUserType(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async update(userId, data) {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        const updateData = {};
        if (data.email !== undefined) {
            updateData.email = data.email.toLowerCase().trim();
        }
        if (data.displayName !== undefined) {
            updateData.displayName = data.displayName;
        }
        if (data.emailVerified !== undefined) {
            updateData.emailVerified = data.emailVerified;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
        }
        if (data.lastLoginAt !== undefined) {
            updateData.lastLoginAt = data.lastLoginAt;
        }
        try {
            const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, {
                new: true,
                runValidators: true,
            }).exec();
            if (!user) {
                return null;
            }
            return this.toUserType(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    async delete(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        try {
            const user = await UserModel.findByIdAndDelete(userId).exec();
            if (!user) {
                return null;
            }
            return this.toUserType(user);
        }
        catch (error) {
            throw mapDatabaseError(error);
        }
    }
    toUserType(record) {
        return {
            id: record._id.toString(),
            email: record.email,
            displayName: record.displayName,
            status: record.status,
            lastLoginAt: record.lastLoginAt,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
    toUserCredentials(record) {
        return {
            id: record._id.toString(),
            email: record.email,
            passwordHash: record.passwordHash,
        };
    }
}
