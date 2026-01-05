import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Get('favicon.ico')
  @Public()
  getFavicon(@Res() res: Response) {
    // Return 204 No Content for favicon to prevent 500 errors
    res.status(204).end();
  }
}
