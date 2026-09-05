import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ChangePinDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default:{ ttl:60000, limit:10 }}) // authLimiter 10/60s
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req:any){
    return this.auth.login(dto.name, dto.pin, dto.fingerprintId, {ip:req.ip, ua:req.headers['user-agent']});
  }

    @UseGuards(JwtAuthGuard)
    @Get('verify')
    verify(@CurrentUser() user:any){
        return {
            valid:true,
            user
        }
        

    }

@UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user:any){
    // يمكن جلب التفاصيل من DB لو أردت
    return { user };
  }


  @UseGuards(JwtAuthGuard)
  @Post('change-pin')
  changePin(@CurrentUser() user:any, @Body() dto:ChangePinDto){
    return this.auth.changePin(user, dto.currentPin, dto.newPin);
  }




  
}