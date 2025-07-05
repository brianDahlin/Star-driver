// src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './utils/logger';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { Telegraf, Context } from 'telegraf';
import { CallbackData } from './common/constants/payment.constants';

async function bootstrap(): Promise<void> {
  // инициализация DI-контекста без HTTP-сервера
  const appCtx = await NestFactory.createApplicationContext(AppModule, {
    logger: AppLogger,
  });
  AppLogger.log('🟢 Application context initialized');

  const config = appCtx.get(ConfigService);
  const botService = appCtx.get(BotService);

  const token = config.getOrThrow<string>('TELEGRAM_TOKEN');
  const bot = new Telegraf<Context>(token);

  // Обработка команды /start
  bot.start((ctx) => botService.handleStart(ctx.chat.id));

  // Обработка inline-кнопок через фильтры
  bot.action(CallbackData.BUY, (ctx) => {
    // убираем часы
    ctx.answerCbQuery().catch(() => {});
    return botService.handleCallback(
      ctx.callbackQuery.id,
      CallbackData.BUY,
      ctx.from.id,
    );
  });
  bot.action(CallbackData.GIFT, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    return botService.handleCallback(
      ctx.callbackQuery.id,
      CallbackData.GIFT,
      ctx.from.id,
    );
  });

  // Обработка всех остальных текстовых сообщений
  // Обработка всех текстовых сообщений
  bot.on('text', (ctx) => {
    // ctx.message.text гарантированно строка для 'text' события
    return botService.handleMessage(ctx.chat.id, ctx.message.text);
  });

  // Сбрасываем вебхук, запускаем polling
  await bot.telegram.deleteWebhook();
  AppLogger.log('🔄 Webhook cleared, starting polling');
  await bot.launch({ dropPendingUpdates: true });
  AppLogger.log('🤖 Bot polling launched');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

bootstrap().catch((err) => AppLogger.error('❌ Bootstrap failed', err));
