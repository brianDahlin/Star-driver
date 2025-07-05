// src/bot/bot.service.ts
import { Injectable } from '@nestjs/common';
import { Update, Start, Action, On, Ctx } from 'nestjs-telegraf';
import { Scenes, Context as BaseContext } from 'telegraf';

export type MyContext = Scenes.SceneContext & BaseContext;

@Update()
@Injectable()
export class BotService {
  @Start()
  async onStart(@Ctx() ctx: MyContext): Promise<void> {
    await ctx.scene.enter('start');
  }

  /** При нажатии «⭐ Купить Звёзды» */
  @Action('BUY')
  async onBuy(@Ctx() ctx: MyContext): Promise<void> {
    await ctx.scene.enter('buy-wizard');
  }

  /** При нажатии «🎁 Подарок другу» */
  @Action('GIFT')
  async onGift(@Ctx() ctx: MyContext): Promise<void> {
    await ctx.scene.enter('gift-wizard');
  }

  /** Всё остальное – подсказываем, как начать */
  @On('message')
  async onMessage(@Ctx() ctx: MyContext): Promise<void> {
    await ctx.reply(
      'Извините, я вас не понял. Воспользуйтесь /start или кнопками.',
    );
  }
}
