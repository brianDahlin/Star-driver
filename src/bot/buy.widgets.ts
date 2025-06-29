import { Scenes, Markup } from 'telegraf';
import { Injectable } from '@nestjs/common';
import { FragmentService } from '../payments/fragment.service';

@Injectable()
@Scenes.WizardStep()
export class BuyScene extends Scenes.WizardScene {
  constructor(private readonly fragment: FragmentService) {
    super(
      'buy-wizard',
      async (ctx) => {
        await ctx.reply('🌟 Введите нужное количество звёзд (минимум 50):');
        return this.next();
      },
      async (ctx) => {
        const count = parseInt(ctx.message.text);
        ctx.wizard.state.count = count;
        await ctx.reply(
          '💳 Выберите способ оплаты:',
          Markup.keyboard([
            ['TON', 'Крипта / USDT'],
            ['СБП / Карты РФ'],
            ['Назад'],
          ]).oneTime(),
        );
        return this.next();
      },
      async (ctx) => {
        const choice = ctx.message.text;
        const { count } = ctx.wizard.state;
        if (choice === 'TON') {
          const invoice = await this.fragment.createTonInvoice(count);
          return ctx.reply(
            `Пополните внутренний кошелёк по адресу:\n\`${invoice.walletAddress}\`\nСумма: ${invoice.amount} TON`,
            { parse_mode: 'Markdown' },
          );
        }
        if (choice === 'Крипта / USDT') {
          const link = await this.fragment.createUsdtLink(count);
          return ctx.replyWithHTML(
            `Перейдите по ссылке для оплаты USDT:\n<a href="${link}">Оплатить</a>`,
          );
        }
        if (choice === 'СБП / Карты РФ') {
          const link = await this.fragment.createSbpLink(count);
          return ctx.replyWithHTML(
            `Перейдите по ссылке для оплаты картой:\n<a href="${link}">Оплатить</a>`,
          );
        }
        return ctx.scene.leave();
      },
    );
  }
}
