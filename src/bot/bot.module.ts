import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot.service';
import { HttpModule } from '@nestjs/axios';
import { FragmentService } from '../payments/fragment.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [BotService, FragmentService],
  exports: [BotService, FragmentService],
})
export class BotModule {}
