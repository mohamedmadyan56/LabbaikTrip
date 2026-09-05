import { Injectable } from '@nestjs/common';
import jwtConfig from '../../config/'

@Injectable()
export class GenerateTokensProvider {
   constructor (
   private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfig,
   )
}
