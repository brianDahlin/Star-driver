import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { StartScene } from './start.scene';
import { BuyScene } from './buy.widgets';
import { GiftScene } from './gift.widgets';
import { TonService } from '../ton/ton.service';
import { KassaService } from '../payments/kassa.service';
import { FragmentService } from '../payments/fragment.service';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('TELEGRAM_TOKEN'),
        include: [BotService, StartScene, BuyScene, GiftScene],
      }),
    }),
  ],
  providers: [
    BotService,
    StartScene,
    BuyScene,
    GiftScene,
    TonService,
    KassaService,
    FragmentService,
  ],
})
export class BotModule {}
