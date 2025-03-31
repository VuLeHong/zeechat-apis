import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { AddFriendDto } from "./dto/add-friend.dto";

@ApiTags("User")
@Controller("user")
@ApiBearerAuth() // Add if authentication is required
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: "Create User" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user data' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login User" })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() LoginUserDto: LoginUserDto) {
    return this.userService.login(LoginUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Get All Users" })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all users' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id/friends')
  @ApiOperation({ summary: "Search All Friends" })
  @ApiParam({ name: 'id', description: 'ID of the user', type: String })
  @ApiQuery({ 
    name: 'searchText', 
    description: 'Optional search text to filter friends', 
    required: false 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved friends list' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getAllFriends(
    @Param("id") user_id: string,
    @Query('searchText') searchText: string = ''
  ) {
    return this.userService.getAllFriends(user_id, searchText);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get User by ID" })
  @ApiParam({ name: 'id', description: 'ID of the user to retrieve', type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Patch(":id/update")
  @ApiOperation({ summary: "Update User by ID" })
  @ApiParam({ name: 'id', description: 'ID of the user to update', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Post(":id/status")
  @HttpCode(200)
  @ApiOperation({ summary: "Update User Status by ID" })
  @ApiParam({ name: 'id', description: 'ID of the user to update status', type: String })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateStatus(@Param("id") id: string) {
    return this.userService.updateStatus(id);
  }

  @Patch(":id/friend")
  @ApiOperation({ summary: "Add Friend to User" })
  @ApiParam({ name: 'id', description: 'ID of the user adding a friend', type: String })
  @ApiBody({ type: AddFriendDto })
  @ApiResponse({ status: 200, description: 'Friend added successfully' })
  @ApiResponse({ status: 404, description: 'User or friend not found' })
  @ApiResponse({ status: 400, description: 'Invalid friend data' })
  addFriend(
    @Param("id") id: string,
    @Body() addFriendDto: AddFriendDto
  ) {
    return this.userService.addFriend(id, addFriendDto);
  }

  @Delete(":id/friend")
  @ApiOperation({ summary: "Remove Contact" })
  @ApiParam({ name: 'id', description: 'ID of the user deleting a friend', type: String })
  @ApiBody({ type: AddFriendDto })
  @ApiResponse({ status: 200, description: 'Friend removed successfully' })
  @ApiResponse({ status: 404, description: 'User or friend not found' })
  @ApiResponse({ status: 400, description: 'Invalid friend data' })
  removeFriend(
    @Param("id") id: string,
    @Body() addFriendDto: AddFriendDto
  ) {
    return this.userService.removeFriend(id, addFriendDto);
  }

  @Delete(":id/delete")
  @ApiOperation({ summary: "Delete User by ID" })
  @ApiParam({ name: 'id', description: 'ID of the user to delete', type: String })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  delete(@Param("id") id: string) {
    return this.userService.delete(id);
  }
}