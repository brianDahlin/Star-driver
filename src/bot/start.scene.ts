import { Scenes, Markup } from 'telegraf';
import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
@Scenes.Stage()
export class StartScene {
  constructor(@InjectBot() private bot: Telegraf) {}

  @Scenes.Start()
  async onStart(ctx: Scenes.SceneContext) {
    await ctx.replyWithPhoto(
      { url: 'https://…starship-banner.png' },
      {
        caption:
          '✨ Добро пожаловать! Здесь вы можете купить Звёзды дешевле, чем в Telegram.\nБез KYC — просто, быстро и удобно.',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⭐ Купить Звёзды', 'BUY')],
          [Markup.button.callback('🎁 Сделать Подарок Другу', 'GIFT')],
        ]),
      },
    );
    ctx.scene.leave();
  }
}
