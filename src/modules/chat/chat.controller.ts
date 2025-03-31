import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, Put, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { UpdateChatDto } from "./dto/update-chat.dto";
import { UploadDto } from "./dto/upload.dto";

@ApiTags("Chat")
@Controller("chat")
// @ApiBearerAuth() 
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a new chat for a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user creating the chat' })
  @ApiBody({ type: CreateChatDto })
  @ApiResponse({ status: 200, description: 'Chat created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createChat(
    @Param('userId') user_id: string,
    @Body() createChatDto: CreateChatDto
  ) {
    return this.chatService.createChat(user_id, createChatDto);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get all messages in a chat with pagination' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number (1-based)', 
    required: false, 
    type: Number 
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of messages per page', 
    required: false, 
    type: Number 
  })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  getChatMessages(
    @Param('chatId') chat_id: string,
    @Query('page', { transform: (value) => parseInt(value) || 1 }) page: number = 1,
    @Query('limit', { transform: (value) => parseInt(value) || 20 }) limit: number = 20
  ) {
    return this.chatService.getChatMessages(chat_id, page, limit);
  }

  @Patch('/:chatId')
  @ApiOperation({ summary: 'Update chat strict mode' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat to update' })
  @ApiResponse({ status: 200, description: 'Chat updated successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  updateStrict(
    @Param('chatId') chat_id: string
  ){
    try {
      return this.chatService.updateStrict(chat_id);
    } catch (error) {
      console.log(error);
    }
  }

  @Delete('/:chatId')
  @ApiOperation({ summary: 'Delete chat by ID' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat to update' })
  @ApiResponse({ status: 200, description: 'Chat updated successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  deleteChatById(
    @Param('chatId') chat_id: string
  ){
    try {
      return this.chatService.deleteChatById(chat_id);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all chats for a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'User chats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserChats(@Param('userId') user_id: string) {
    return this.chatService.getUserChats(user_id);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat details by ID' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiResponse({ status: 200, description: 'Chat details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  getChatById(
    @Param('chatId') chat_id: string
  ) {
    return this.chatService.getChatById(chat_id);
  }

  @Post(':chatId/add-member')
  @HttpCode(200)
  @ApiOperation({ summary: 'Add a member to a chat' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiQuery({ name: 'memberId', description: 'ID of the member to add' })
  @ApiResponse({ status: 200, description: 'Member added successfully' })
  @ApiResponse({ status: 404, description: 'Chat or member not found' })
  addMember(
    @Param('chatId') chat_id: string,
    @Query('memberId') member_id: string
  ) {
    return this.chatService.addMember(chat_id, member_id);
  }

  @Post(':chatId/remove-member')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a member from a chat' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiQuery({ name: 'memberId', description: 'ID of the member to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Chat or member not found' })
  removeMember(
    @Param('chatId') chat_id: string,
    @Query('memberId') member_id: string
  ) {
    return this.chatService.removeMember(chat_id, member_id);
  }

  @Patch(':chatId/update-name')
  @ApiOperation({ summary: 'Update chat name' })
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiBody({ type: UpdateChatDto })
  @ApiResponse({ status: 200, description: 'Chat name updated successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  updateChatById(
    @Param('chatId') chat_id: string,
    @Body() updateChatDto: UpdateChatDto
  ) {
    return this.chatService.updateChatById(chat_id, updateChatDto);
  }

  @ApiOperation({ summary: 'Upload an image to a chat' })
  @ApiConsumes('multipart/form-data')
  @Post(':chatId/upload-image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiBody({
    description: 'Image file upload',
    type: UploadDto,
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded' })
  uploadImage(
    @Param('chatId') chat_id: string,
    @Body() uploadDto: UploadDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.chatService.uploadImageByChatId(chat_id, uploadDto.sender_id, file);
  }

  @ApiOperation({ summary: 'Upload a file to a chat' })
  @ApiConsumes('multipart/form-data')
  @Post(':chatId/upload-file')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'chatId', description: 'ID of the chat' })
  @ApiBody({
    description: 'File upload',
    type: UploadDto,
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded' })
  uploadFile(
    @Param('chatId') chat_id: string,
    @Body() uploadDto: UploadDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.chatService.uploadFileByChatId(chat_id, uploadDto.sender_id, file);
  }
}