import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        TELEGRAM_TOKEN: Joi.string().required(),
        // TON_ENDPOINT: Joi.string().uri().required(),
        // FRAGMENT_API_KEY: Joi.string().required(),
        // KASSA_SHOP_ID: Joi.string().required(),
        // KASSA_SECRET: Joi.string().required(),
      }),
    }),
    BotModule,
  ],
})
export class AppModule {}
