import { UserModel } from './auth.model.js';

export class AuthRepository {
  async findByEmail(email) {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id) {
    return UserModel.findById(id).exec();
  }

  async create(data) {
    return UserModel.create({
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role,
    });
  }

  async updateRefreshToken(userId, refreshToken) {
    await UserModel.findByIdAndUpdate(userId, { refreshToken }).exec();
  }
}

export const authRepository = new AuthRepository();
