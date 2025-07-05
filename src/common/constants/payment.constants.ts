// src/common/constants/payment.constants.ts

/** Идентификаторы callback для inline-кнопок */
export enum CallbackData {
  BUY = 'BUY',
  GIFT = 'GIFT',
}

/** Методы оплаты */
export enum PaymentMethod {
  TON = 'TON',
  USDT = 'Крипта / USDT',
  SBP = 'СБП / Карты РФ',
}

/** Клавиатура с методами оплаты */
export const PAYMENT_KEYBOARD = [
  [PaymentMethod.TON, PaymentMethod.USDT],
  [PaymentMethod.SBP],
] as const;
