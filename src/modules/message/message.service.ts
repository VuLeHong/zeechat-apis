import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Message, MessageDocument } from "./schemas/message.schema";



@Injectable()
export class MessageService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) { }

  async findAll() {
    const users = await this.messageModel.find({deleted_at: null}).exec();
    return users;
  }

  async findOne(id: string) {
    const user = await this.messageModel.findOne({
      "_id": new Types.ObjectId(id),
      deleted_at: null,
    }).exec();
    return user;
  }

}
