import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HttpModule } from '@nestjs/axios';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        TELEGRAM_TOKEN: Joi.string().required(),
        FRAGMENT_API_KEY: Joi.string().required(),
        FRAGMENT_API_URL: Joi.string().uri().required(),
        // KASSA_SHOP_ID: Joi.string().required(),
        // KASSA_SECRET: Joi.string().required(),
      }),
    }),
    HttpModule,
    BotModule,
  ],
})
export class AppModule {}
