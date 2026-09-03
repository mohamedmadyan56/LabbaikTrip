import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
export class LoginDto {
  @IsString() 
  @IsNotEmpty() 
  name: string;

  @IsString() 
  @IsNotEmpty() 
  @Length(4,20) 
  pin: string;

  @IsOptional() 
  @IsString() 
  fingerprintId?: string;
}