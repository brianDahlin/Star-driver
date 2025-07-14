import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface StarsOrderResponse {
  success: boolean;
  id: string;
  receiver: string;
  goods_quantity: number;
  username: string;
  sender: {
    phone_number: string;
    name: string;
  };
  ton_price: string;
  ref_id: string;
}

@Injectable()
export class FragmentService {
  private readonly logger = new Logger(FragmentService.name);
  private jwtToken: string | null = null;
  private readonly apiKey: string;
  private readonly phoneNumber: string;
  private readonly mnemonics: string[];
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('FRAGMENT_API_KEY');
    this.phoneNumber = this.config.getOrThrow<string>('FRAGMENT_PHONE_NUMBER');
    // MNEMONICS: space-separated or JSON array
    const raw = this.config.getOrThrow<string>('FRAGMENT_MNEMONICS').trim();
    this.mnemonics = raw.split(/\s+/).filter((w) => w.length);
    this.baseUrl = this.config.getOrThrow<string>('FRAGMENT_API_URL');
  }

  /**
   * Аутентификация в Fragment API, получение JWT-токена
   */
  private async authenticate(): Promise<void> {
    this.logger.log('Authenticating with Fragment API');
    const url = `${this.baseUrl}/auth/authenticate/`;
    const payload = {
      api_key: this.apiKey,
      phone_number: this.phoneNumber,
      mnemonics: this.mnemonics,
    };

    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string }>(url, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      this.jwtToken = response.data.token;
      this.logger.log('Fragment JWT token acquired');
    } catch (err) {
      this.logger.error('Fragment authentication failed', err as Error);
      throw new BadGatewayException(
        'Не удалось аутентифицироваться в Fragment API',
      );
    }
  }

  /**
   * Создаёт заказ звёзд через Fragment API
   * @param receiver Telegram username без '@'
   * @param quantity количество звёзд (минимум 50)
   * @param showSender показывать отправителя в заказе
   */
  async buyStars(
    username: string,
    quantity: number,
    showSender = false,
  ): Promise<StarsOrderResponse> {
    if (!this.jwtToken) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}/order/stars/`;
    const body = { username, quantity, show_sender: showSender };
    this.logger.log(`Creating stars order for @${username}, qty=${quantity}`);

    try {
      const response = await firstValueFrom(
        this.http.post<StarsOrderResponse>(url, body, {
          headers: {
            Authorization: `JWT ${this.jwtToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`Order created: ${response.data.id}`);
      return response.data;
    } catch (err) {
      this.logger.error('Fragment create order failed', err as Error);
      throw new BadGatewayException(
        'Не удалось создать заказ через Fragment API',
      );
    }
  }
}
