import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsEmail, IsDateString } from "class-validator";
import { ObjectId } from "mongoose";

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  name: string;
}
