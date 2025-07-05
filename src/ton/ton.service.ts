// import { Injectable } from '@nestjs/common';
// import { TonClient } from '@tonclient/core';
// import { libNode } from '@tonclient/lib-node';

// TonClient.useBinaryLibrary(libNode);

// @Injectable()
// export class TonService {
//   private client = new TonClient({
//     network: { endpoints: [process.env.TON_ENDPOINT] },
//   });

//   async createInvoice(amountStars: number) {
//     // логика перевода TON на адрес fragment.com
//     // возвращаем адрес и сумму
//     return { walletAddress: 'EQC...', amount: 0.05 };
//   }

//   async waitForPayment(address: string, amount: number) {
//     // слушаем приходящий tx
//   }
// }
