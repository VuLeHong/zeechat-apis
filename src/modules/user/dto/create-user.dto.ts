import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsEmail, IsDateString } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  password: string;
}
