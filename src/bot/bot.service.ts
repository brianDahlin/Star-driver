// src/bot/bot.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Telegram } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { MIN_STARS, START_CAPTION } from '../common/constants/star.constants';
import {
  CallbackData,
  PaymentMethod,
  PAYMENT_KEYBOARD,
} from '../common/constants/payment.constants';

// Сессия пользователя для диалогов
interface SessionData {
  flow: 'buy' | 'gift';
  step: number;
  username?: string;
  count?: number;
}

@Injectable()
export class BotService {
  private readonly tg: Telegram;
  private readonly logger = new Logger(BotService.name);
  private readonly session = new Map<number, SessionData>();

  constructor(private readonly config: ConfigService) {
    const token = this.config.getOrThrow<string>('TELEGRAM_TOKEN');
    this.tg = new Telegram(token);
    this.logger.log('Telegram client initialized');
  }

  /** Обработка команды /start */
  async handleStart(chatId: number): Promise<void> {
    this.session.delete(chatId);
    const bannerUrl = this.config.getOrThrow<string>('BANNER_URL');
    try {
      await this.tg.sendPhoto(chatId, bannerUrl, {
        caption: START_CAPTION,
        reply_markup: {
          inline_keyboard: [
            [{ text: '⭐ Купить Звёзды', callback_data: CallbackData.BUY }],
            [
              {
                text: '🎁 Сделать Подарок Другу',
                callback_data: CallbackData.GIFT,
              },
            ],
          ],
        },
      });
      this.logger.log(`/start handled for chat ${chatId}`);
    } catch (err) {
      this.logger.error(`handleStart failed for chat ${chatId}`, err as Error);
      await this.tg.sendMessage(chatId, START_CAPTION);
    }
  }

  /** Обработка нажатия inline-кнопок */
  async handleCallback(
    queryId: string,
    data: CallbackData,
    userId: number,
  ): Promise<void> {
    await this.tg.answerCbQuery(queryId).catch(() => {});
    let session: SessionData;
    switch (data) {
      case CallbackData.BUY:
        session = { flow: 'buy', step: 1 };
        this.session.set(userId, session);
        await this.askCount(userId);
        return;
      case CallbackData.GIFT:
        session = { flow: 'gift', step: 1 };
        this.session.set(userId, session);
        await this.askUsername(userId);
        return;
      default:
        await this.tg.sendMessage(
          userId,
          'Неизвестная команда. Нажмите /start.',
        );
        return;
    }
  }

  /** Обработка любого текстового сообщения */
  async handleMessage(chatId: number, text: string): Promise<void> {
    const session = this.session.get(chatId);
    if (!session) {
      await this.tg.sendMessage(chatId, 'Нажмите /start, чтобы начать.');
      return;
    }
    if (session.flow === 'buy') {
      await this.processBuyFlow(chatId, text, session);
    } else {
      await this.processGiftFlow(chatId, text, session);
    }
  }

  /** Шаг 1: запрашиваем количество звёзд */
  private async askCount(chatId: number): Promise<void> {
    await this.tg.sendMessage(
      chatId,
      `🌟 Введите нужное количество звёзд (минимум ${MIN_STARS}):`,
    );
  }

  /** Шаг 1 (подарок): запрашиваем username получателя */
  private async askUsername(chatId: number): Promise<void> {
    await this.tg.sendMessage(chatId, 'Введите @username получателя:');
  }

  /** Обрабатываем поток покупки */
  private async processBuyFlow(
    chatId: number,
    text: string,
    session: SessionData,
  ): Promise<void> {
    if (session.step === 1) {
      const count = Number(text);
      if (isNaN(count) || count < MIN_STARS) {
        await this.tg.sendMessage(
          chatId,
          `❌ Введите корректное число (минимум ${MIN_STARS}).`,
        );
        return;
      }
      session.count = count;
      session.step = 2;
      await this.sendPaymentOptions(chatId);
      return;
    }
    // шаг 2: выбор оплаты
    const method = text as PaymentMethod;
    await this.processPayment(chatId, method, session, false);
  }

  /** Обрабатываем поток подарка */
  private async processGiftFlow(
    chatId: number,
    text: string,
    session: SessionData,
  ): Promise<void> {
    if (session.step === 1) {
      session.username = text.trim().replace(/^@/, '');
      session.step = 2;
      await this.askCount(chatId);
      return;
    }
    if (session.step === 2) {
      const count = Number(text);
      if (isNaN(count) || count < MIN_STARS) {
        await this.tg.sendMessage(
          chatId,
          `❌ Введите корректное число (минимум ${MIN_STARS}).`,
        );
        return;
      }
      session.count = count;
      session.step = 3;
      await this.sendPaymentOptions(chatId);
      return;
    }
    // шаг 3: выбор оплаты
    const method = text as PaymentMethod;
    await this.processPayment(chatId, method, session, true);
  }

  /** Отправляем клавиатуру с методами оплаты */
  private async sendPaymentOptions(chatId: number): Promise<void> {
    await this.tg.sendMessage(chatId, '💳 Выберите способ оплаты:', {
      reply_markup: {
        keyboard: PAYMENT_KEYBOARD.map((row) => row.map((text) => ({ text }))),
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  /** Общая обработка оплаты (моки) */
  private async processPayment(
    chatId: number,
    choice: PaymentMethod,
    session: SessionData,
    isGift: boolean,
  ): Promise<void> {
    const count = session.count!;
    switch (choice) {
      case PaymentMethod.TON: {
        const invoice = { walletAddress: 'EQC123ABC...', amount: 0.123 };
        await this.tg.sendMessage(
          chatId,
          `Пополните внутренний кошелёк: ${invoice.walletAddress}\nСумма: ${invoice.amount} TON`,
        );
        break;
      }
      case PaymentMethod.USDT: {
        const link = 'https://example.com/pay-usdt';
        await this.tg.sendMessage(chatId, `Оплатить USDT: ${link}`);
        break;
      }
      case PaymentMethod.SBP: {
        const link = 'https://example.com/pay-sbp';
        await this.tg.sendMessage(chatId, `Оплатить картой/СБП: ${link}`);
        break;
      }
      default:
        await this.tg.sendMessage(chatId, '❗ Выберите способ оплаты из меню.');
        this.session.delete(chatId);
        return;
    }

    if (isGift) {
      await this.tg.sendMessage(
        chatId,
        `🎉 Вы подарили ${count} звёзд пользователю @${session.username}!`,
      );
    }
    await this.tg.sendMessage(chatId, '✅ Операция завершена.', {
      reply_markup: { remove_keyboard: true },
    });
    this.session.delete(chatId);
  }
}
