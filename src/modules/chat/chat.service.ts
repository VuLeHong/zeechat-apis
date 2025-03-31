import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Chat, ChatDocument } from "./schemas/chat.schema";
import { Message } from "../message/schemas/message.schema";
import { CreateChatDto } from "./dto/create-chat.dto";
import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { User } from "../user/schemas/user.schema";
import { UpdateChatDto } from "./dto/update-chat.dto";
import { S3Service } from "./s3.service";



@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly s3Service: S3Service,
  ) { }

  @WebSocketServer()
  server: Server;


  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { chat_id: string; sender_id: string; content: string }) {
    try {
      if (!payload.chat_id || !payload.sender_id || !payload.content) {
        throw new WsException('Invalid payload');
      }
      const chat = await this.getChatById(payload.chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      const validMembers = chat.members.some(member =>
        member.equals(payload.sender_id.toString())
      );

      if (!validMembers) {
        throw new WsException('Unauthorized');
      }
      const type = 'normal';
      const message = await this.sendMessage(payload.chat_id, payload.sender_id, payload.content, type);
      this.server.to(payload.chat_id).emit('newMessage', message);
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('sendNotiAdjustMember')
  async handleMemberNoti(client: Socket, payload: { chat_id: string; sender_id: string; member_id: string; isAdd: boolean }) {
    try {
      if (!payload.chat_id || !payload.sender_id || !payload.member_id || payload.isAdd === undefined) {
        throw new WsException('Invalid payload');
      }
      const chat = await this.getChatById(payload.chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      const member = await this.userModel.findOne({_id: payload.member_id, deleted_at:null}).exec();
      const new_content = payload.isAdd === true ? `${member.name} was added to group` : `${member.name} was removed from group`;
      const message = await this.sendMessage(payload.chat_id, payload.sender_id, new_content, 'noti');
      this.server.to(payload.chat_id).emit('newMessage', message);
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('sendNotiUpdateGroupName')
  async handleGroupNameNoti(client: Socket, payload: { chat_id: string; sender_id: string; groupName: string }) {
    try {
      if (!payload.chat_id || !payload.sender_id || !payload.groupName) {
        throw new WsException('Invalid payload');
      }
      const chat = await this.getChatById(payload.chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      const new_content = `Group name was changed to ${payload.groupName}`;
      const message = await this.sendMessage(payload.chat_id, payload.sender_id, new_content, 'noti');
      this.server.to(payload.chat_id).emit('newMessage', message);
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { chat_id: string; sender_id: string }) {
    try {
      if (!payload.chat_id || !payload.sender_id) {
        throw new WsException('Invalid payload');
      }
      const chat = await this.getChatById(payload.chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      this.server.to(payload.chat_id).emit('typing', { sender_id: payload.sender_id });
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(client: Socket, payload: { chat_id: string; sender_id: string }) {
    try {
      if (!payload.chat_id || !payload.sender_id) {
        throw new WsException('Invalid payload');
      }
      const chat = await this.getChatById(payload.chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      this.server.to(payload.chat_id).emit('stopTyping', { sender_id: payload.sender_id });
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('adjustStrict')
  async handleAdjustStrict(client: Socket, chat_id: string) {
    try {
      if (!chat_id) {
        throw new WsException('Invalid payload');
      }
      await this.updateStrict(chat_id);
      const chat = await this.getChatById(chat_id);
      if (!chat) {
        throw new WsException('Chat not found');
      }
      this.server.to(chat_id).emit('adjustStrict', { is_strict: chat.is_strict });
      const new_content = `Group strict mode was turned ${chat.is_strict ? 'on' : 'off'}`;
      const message = await this.sendMessage(chat_id, chat.owner_id.toString(), new_content, 'noti'); 
      this.server.to(chat_id).emit('newMessage', message);
    } catch (error) {
      if (error instanceof WsException) {
        client.emit('error', error.message);
      } else {
        console.error('Unexpected error:', error);
        client.emit('error', 'Internal server error');
      }
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, chat_id: string) {
    const chat = await this.getChatById(chat_id);
    if (!chat) {
      client.emit('error', 'Chat not found');
      return;
    }
    client.join(chat_id);
    client.emit('joinedChat', chat_id);
  }

  @SubscribeMessage('subscribeToUser')
  async handleSubscribeToUser(client: Socket, userId: string) {
    client.join(userId);
    client.emit('user subscribed', userId);
  }

  async createChat(user_id: string, createChatDto: CreateChatDto) {
    const members = createChatDto.members.map(member => new Types.ObjectId(member));
    const isGroup = createChatDto.is_group || false;
    const groupName = isGroup ? createChatDto.groupName : null;

    // Create and save the chat
    const chat = new this.chatModel({
      owner_id: new Types.ObjectId(user_id),
      members,
      is_group: isGroup,
      is_strict: false,
      groupName,
      deleted_at: null,
    });
    const savedChat = await chat.save();

    // Prepare chat data for emission
    const chatData = {
      _id: savedChat._id.toString(),
      is_group: savedChat.is_group,
      members: savedChat.members.map(id => id.toString()),
      groupName: savedChat.groupName,
      owner_id: savedChat.owner_id.toString(),
      is_strict: savedChat.is_strict,
    };

    // Emit to all members
    createChatDto.members.forEach(memberId => {
      this.server.to(memberId).emit('chatCreated', chatData);
    });
    return savedChat;
  }



  async sendMessage(chat_id: string, sender_id: string, content: string, type: string) {
    try {
      const message = new this.messageModel({
        chat_id: new Types.ObjectId(chat_id),
        sender_id: new Types.ObjectId(sender_id),
        content,
        type: type,
        deleted_at: null,
      });
      return message.save();
    } catch (error) {
      console.log(error);
    }
  }

  async updateStrict(chat_id: string) {
    const chat = await this.chatModel.findOne({_id: new Types.ObjectId(chat_id), deleted_at:null}).exec();
    if (!chat) throw new Error('Chat not found');
    return this.chatModel.updateOne(
      { _id: new Types.ObjectId(chat_id), deleted_at:null },
      { is_strict: !chat.is_strict }
    ).exec();
  }

  async addMember(chat_id: string, member_id: string) {
    const chat = await this.chatModel.findOne({_id: new Types.ObjectId(chat_id), deleted_at:null}).exec();
    if (!chat) throw new Error('Chat not found');
    if (chat.members.includes(new Types.ObjectId(member_id))) throw new Error('Member already in chat');
    return this.chatModel.updateOne(
      { _id: new Types.ObjectId(chat_id), deleted_at:null },
      { $addToSet: { members: new Types.ObjectId(member_id) } }
    ).exec();
  }

  async removeMember(chat_id: string, member_id: string) {
    const chat = await this.chatModel.findOne({_id: new Types.ObjectId(chat_id), deleted_at:null}).exec();
    if (!chat) throw new Error('Chat not found');
    if (!chat.members.includes(new Types.ObjectId(member_id))) throw new Error('Member not in chat');
    return this.chatModel.updateOne(
      { _id: new Types.ObjectId(chat_id), deleted_at:null },
      { $pull: { members: new Types.ObjectId(member_id) } }
    ).exec();
  }

  async getChatMessages(chat_id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ 
          chat_id: new Types.ObjectId(chat_id), 
          deleted_at: null 
        })
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel
        .countDocuments({ 
          chat_id: new Types.ObjectId(chat_id), 
          deleted_at: null 
        })
        .exec()
    ]);
    const sortedMessages = messages.reverse();
    return {
      messages: sortedMessages,  // For page=1, limit=20: returns 20 newest messages
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
}

  async getUserChats(user_id: string) {
    return this.chatModel.find({ members: new Types.ObjectId(user_id), deleted_at:null }).exec();
  }

  async getChatById(chat_id: string) {
    return this.chatModel.findOne({ _id: new Types.ObjectId(chat_id), deleted_at:null }).exec();
  }

  async deleteChatById(chat_id: string ) {
    const updatedChat = await this.chatModel.updateOne({ _id: new Types.ObjectId(chat_id), deleted_at: null }, {deleted_at: new Date() }).exec();
    const updateMessages = await this.messageModel.updateMany({ chat_id: new Types.ObjectId(chat_id), deleted_at: null }, {deleted_at: new Date() }).exec();
    // const savedChat = await this.getChatById(chat_id);
    // savedChat.members.forEach(memberId => {
    //   this.server.to(memberId.toString()).emit('chatCreated', chatData);
    // });
    this.server.to(chat_id).emit('chatUpdated');

    return updatedChat;
  }

  async updateChatById(chat_id: string, updateChatDto: UpdateChatDto) {
    const updatedChat = await this.chatModel.updateOne({ _id: new Types.ObjectId(chat_id), deleted_at:null }, { groupName: updateChatDto.name }).exec();
    const savedChat = await this.getChatById(chat_id);
    const chatData = {
      _id: savedChat._id.toString(),
      is_group: savedChat.is_group,
      members: savedChat.members.map(id => id.toString()),
      groupName: savedChat.groupName,
      owner_id: savedChat.owner_id.toString(),
      is_strict: savedChat.is_strict,
    };
    savedChat.members.forEach(memberId => {
      this.server.to(memberId.toString()).emit('chatCreated', chatData);
    });
    this.server.to(chat_id).emit('chatUpdated', chatData);

    return updatedChat;
  }

  async uploadFileByChatId(chat_id: string, sender_id: string, file: Express.Multer.File) {
    const [name, extension] = file.originalname.split('.'); // Split into "document" and "pdf"
    const key = `${name} - ${Date.now()}.${extension}`;
    const result = await this.s3Service.uploadFile(file, key);
    const content = result?.url;
    const message = await this.sendMessage(chat_id, sender_id, content, 'file');
    this.server.to(chat_id).emit('newMessage', message);
    return message;
  }

  async uploadImageByChatId(chat_id: string, sender_id: string, file: Express.Multer.File) {
    const [name, extension] = file.originalname.split('.'); // Split into "document" and "pdf"
    const key = `${name} - ${Date.now()}.${extension}`;
    const result = await this.s3Service.uploadImage(file, key);
    const content = result?.url;
    const message = await this.sendMessage(chat_id, sender_id, content, 'image');
    this.server.to(chat_id).emit('newMessage', message);
    return message;
  }

}
