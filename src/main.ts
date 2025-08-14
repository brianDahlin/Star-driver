import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './utils/logger';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { Telegraf, Context } from 'telegraf';
import { CallbackData } from './common/constants/payment.constants';
import { Markup } from 'telegraf';

async function bootstrap(): Promise<void> {
  // инициализация DI-контекста без HTTP-сервера
  const appCtx = await NestFactory.createApplicationContext(AppModule, {
    logger: AppLogger,
  });
  AppLogger.log('🟢 Application context initialized');

  const mainKeyboard = Markup.keyboard([
    ['⭐ Купить Звёзды'],
    ['🎁 Сделать Подарок Другу'],
  ])
    .resize()
    .oneTime(false);
  const config = appCtx.get(ConfigService);
  const botService = appCtx.get(BotService);

  const token = config.getOrThrow<string>('TELEGRAM_TOKEN');
  const bot = new Telegraf<Context>(token);

  // Обработка команды /start
  bot.start(async (ctx) => {
    await ctx.reply('Выберите действие:', mainKeyboard);
    return botService.handleStart(ctx.chat.id);
  });

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

  bot.command('buy_stars', (ctx) => {
    // эмулируем callback без queryId
    return botService.handleCallback('', CallbackData.BUY, ctx.chat.id);
  });

  // Slash-команда /gift
  bot.command('gift', (ctx) => {
    return botService.handleCallback('', CallbackData.GIFT, ctx.chat.id);
  });

  // Обработка всех остальных текстовых сообщений
  // Обработка всех текстовых сообщений
  bot.on('text', (ctx) => {
    const text = ctx.message.text;

    // если нажали «⭐ Купить Звёзды» на Reply-клавиатуре
    if (text === '⭐ Купить Звёзды') {
      // пустой queryId, он не нужен для Reply-кнопок
      return botService.handleCallback('', CallbackData.BUY, ctx.chat.id);
    }

    // если нажали «🎁 Купить Другу»
    if (text === '🎁 Сделать Подарок Другу') {
      return botService.handleCallback('', CallbackData.GIFT, ctx.chat.id);
    }

    // всё остальное в общий текст-флоу
    return botService.handleMessage(ctx.chat.id, text);
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

// import 'dotenv/config';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { AppLogger } from './utils/logger';
// import { FragmentService } from './payments/fragment.service';

// async function bootstrap() {
//   const appCtx = await NestFactory.createApplicationContext(AppModule, {
//     logger: AppLogger,
//   });
//   const fragment = appCtx.get(FragmentService);

//   try {
//     await fragment['authenticate'](); // вызываем приватный метод
//     AppLogger.log(`✅ JWT token: ${fragment['jwtToken']}`);
//   } catch (err) {
//     AppLogger.error('❌ Authentication failed', err as Error);
//   }

//   process.exit(0); // завершаем после теста
// }
// bootstrap().catch((err) => AppLogger.error('❌ Bootstrap failed', err));
