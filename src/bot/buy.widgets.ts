// src/bot/buy.widgets.ts
import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { Scenes, Context as TelegrafContext } from 'telegraf';
import { FragmentService } from '../payments/fragment.service';

type MyContext = Scenes.WizardContext & TelegrafContext;

@Wizard('buy-wizard')
@Injectable()
export class BuyScene {
  private readonly logger = new Logger(BuyScene.name);
  private readonly MIN_STARS = 50;

  constructor(private readonly fragment: FragmentService) {}

  @WizardStep(1)
  async askCount(@Ctx() ctx: MyContext): Promise<void> {
    this.logger.log('Шаг 1: запрашиваем количество');
    await ctx.reply(
      `🌟 Введите нужное количество звёзд (минимум ${this.MIN_STARS}):`,
    );
    // Переходим к следующему шагу без await, так как next() синхронный
    ctx.wizard.next();
  }

  @WizardStep(2)
  async choosePaymentMethod(@Ctx() ctx: MyContext): Promise<void> {
    // Проверяем, что это текстовое сообщение
    if (ctx.updateType !== 'message' || typeof ctx.message?.text !== 'string') {
      await ctx.reply(
        `❌ Пожалуйста, отправьте текстовое сообщение с количеством звёзд.`,
      );
      return;
    }
    const rawText = ctx.message.text;
    const text = rawText.trim();
    const count = Number(text);

    if (count < this.MIN_STARS) {
      await ctx.reply(
        `❌ Пожалуйста, введите число не менее ${this.MIN_STARS}.`,
      );
      return;
    }

    ctx.wizard.state.count = count;
    await ctx.reply(
      '💳 Выберите способ оплаты:',
      Markup.keyboard([['TON', 'Крипта / USDT'], ['СБП / Карты РФ'], ['Назад']])
        .oneTime()
        .resize(),
    );
    ctx.wizard.next();
  }

  @WizardStep(3)
  async processPayment(@Ctx() ctx: MyContext): Promise<void> {
    const choice = ctx.message?.text;
    const count = ctx.wizard.state.count as number;

    switch (choice) {
      case 'TON': {
        const invoice = await this.fragment.createTonInvoice(count);
        await ctx.replyWithMarkdownV2(
          `Пополните внутренний кошелёк:\n\`${invoice.walletAddress}\`\nСумма: *${invoice.amount}* TON`,
        );
        break;
      }
      case 'Крипта / USDT': {
        const link = await this.fragment.createUsdtLink(count);
        await ctx.replyWithHTML(
          `Перейдите по ссылке для оплаты USDT:\n<a href="${link}">Оплатить</a>`,
        );
        break;
      }
      case 'СБП / Карты РФ': {
        const link = await this.fragment.createSbpLink(count);
        await ctx.replyWithHTML(
          `Перейдите по ссылке для оплаты картой:\n<a href="${link}">Оплатить</a>`,
        );
        break;
      }
      case 'Назад': {
        await ctx.reply('↩️ Возвращаемся к выбору количества...');
        // Переходим к первому шагу без await
        ctx.wizard.selectStep(0);
        return;
      }
      default: {
        await ctx.reply('❗ Пожалуйста, выберите вариант из клавиатуры.');
        return;
      }
    }

    // Завершаем сцену после инструкций
    await ctx.scene.leave();
  }
}
