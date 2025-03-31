import { Controller, Get, Post, Body, Param, Patch, Delete } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MessageService } from "./message.service";

@ApiTags("Message")
@Controller("message")
// @ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @Get()
  @ApiOperation({ summary: "Get All Messages" })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved all messages' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  findAll() {
    return this.messageService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get Message by ID" })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the message to retrieve',
    type: String 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved message' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid ID format' 
  })
  findOne(@Param("id") id: string) {
    return this.messageService.findOne(id);
  }
}