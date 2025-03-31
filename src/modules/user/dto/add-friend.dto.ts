import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsEmail, IsDateString, IsString } from "class-validator";
import { ObjectId } from "mongoose";

export class AddFriendDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  friend_id: string;
}
