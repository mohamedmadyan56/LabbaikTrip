import {SetMetadata} from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';


export const Authorize = (feature:string,action:string)=> SetMetadata(PERMISSIONS_KEY,{feature,action});