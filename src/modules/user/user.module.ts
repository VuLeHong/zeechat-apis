import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { User, UserSchema } from "./schemas/user.schema";
import { Chat, ChatSchema } from "../chat/schemas/chat.schema";
import { ChatService } from "../chat/chat.service";
import { Message, MessageSchema } from "../message/schemas/message.schema";
import { S3Service } from "../chat/s3.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
