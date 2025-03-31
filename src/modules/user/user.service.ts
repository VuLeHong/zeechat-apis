import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { AddFriendDto } from "./dto/add-friend.dto";
import { ChatService } from "../chat/chat.service";
import { Chat, ChatDocument } from "../chat/schemas/chat.schema";
import { Message, MessageDocument } from "../message/schemas/message.schema";
import { S3Service } from "../chat/s3.service";



@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,

  ) { }

  async create(createUserDto: CreateUserDto) {
    const existedUser = await this.userModel.findOne({
      "email": createUserDto.email
      , deleted_at: null
    });
    if (existedUser) {
      return {
        user: existedUser,
      };
    }
    const createdUser = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      isOnline: false,
      friend_ids: [],
      deleted_at: null,
    });
    const savedUser = await createdUser.save();
    return {
      user: savedUser,
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userModel.findOne({
      "email": loginUserDto.email,
      deleted_at: null,
    });
    if (!user) {
      return {
        message: "User not found",
      };
    }
    if (user.password !== loginUserDto.password) {
      return {
        message: "Password is incorrect",
      }
    }
    return {
      user_id: user._id,
    };
  }

  async getAllFriends(user_id: string, searchText: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(user_id), deleted_at: null }).exec();
    if (!user) {
      throw new Error('User not found');
    }
    const friend_ids = user.friend_ids;
    let friends = [];
    for (const friend_id of friend_ids) {
      const friend = await this.userModel.findOne({
        "_id": new Types.ObjectId(friend_id),
        deleted_at: null,
      }).exec();
      if (friend && (searchText === '' || friend.email.toLowerCase().includes(searchText.toLowerCase()))) {
        const friendData = {
          _id: friend._id,
          name: friend.name,
          email: friend.email,
        };
        friends.push(friendData);
      }
    }
    return friends;
  }


  async findAll() {
    const users = await this.userModel.find({ deleted_at: null }).exec();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }).exec();
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel.findOne({
      "email": email,
      deleted_at: null,
    }).exec();
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findOneAndUpdate({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }, { $set: { "name": updateUserDto.name } }, { new: true }).exec();
    return updatedUser;
  }

  async updateStatus(id: string) {
    const user = await this.userModel.findOne({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }).exec();
    const updatedUser = await this.userModel.findOneAndUpdate({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }, { $set: { "isOnline": !user.isOnline } }, { new: true }).exec();
    return updatedUser;
  }

  async addFriend(id: string, addFriendDto: AddFriendDto) {
    const user = await this.userModel.findOne({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }).exec();

    if (!user) {
      throw new Error('User not found');
    }
    const friends = user.friend_ids;
    if (friends.includes(new Types.ObjectId(addFriendDto.friend_id))) {
      return { message: 'This user is already your friend' };
    } else {
      const updatedUser1 = await this.userModel.findOneAndUpdate(
        { "_id": new Types.ObjectId(id), deleted_at: null },
        { $addToSet: { friend_ids: new Types.ObjectId(addFriendDto.friend_id) } },
        { new: true }
      ).exec();
      const updatedUser2 = await this.userModel.findOneAndUpdate(
        { "_id": new Types.ObjectId(addFriendDto.friend_id), deleted_at: null },
        { $addToSet: { friend_ids: new Types.ObjectId(id) } },
        { new: true }
      ).exec();
      return { message: 'Friend added successfully' };
    }
  }

  async removeFriend(id: string, addFriendDto: AddFriendDto) {
    const user = await this.userModel.findOne({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }).exec();

    if (!user) {
      throw new Error('User not found');
    }
    const friends = user.friend_ids;
    if (!friends.includes(new Types.ObjectId(addFriendDto.friend_id))) {
      return { message: 'This user is not your friend' };
    } else {
      const updatedUser1 = await this.userModel.findOneAndUpdate(
        { "_id": new Types.ObjectId(id), deleted_at: null },
        { $pull: { friend_ids: new Types.ObjectId(addFriendDto.friend_id) } },
        { new: true }
      ).exec();
      const updatedUser2 = await this.userModel.findOneAndUpdate(
        { "_id": new Types.ObjectId(addFriendDto.friend_id), deleted_at: null },
        { $pull: { friend_ids: new Types.ObjectId(id) } },
        { new: true }
      ).exec();
      return { message: 'Friend remove successfully' };
    }
  }

  async delete(id: string) {
    return this.userModel.findOneAndUpdate(
      { "_id": new Types.ObjectId(id), deleted_at: null },
      { $set: { deleted_at: new Date() } },
      { new: true }
    ).exec();
  }

}
