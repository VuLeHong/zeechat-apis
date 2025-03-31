import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatService} from "./chat.service";
import { Chat, ChatSchema } from "./schemas/chat.schema";
import { Message, MessageSchema } from "../message/schemas/message.schema";
import { ChatController } from "./chat.controller";
import { User, UserSchema } from "../user/schemas/user.schema";
import { S3Service } from "./s3.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, S3Service],
})
export class ChatModule { }
