@Injectable()
export class FragmentService {
  constructor(private http: HttpService) {}
  async createTonInvoice(count: number) {
    return this.http.post(...).toPromise().then(r => r.data);
  }
  async createUsdtLink(count: number) { /* … */ }
  async createSbpLink(count: number) { /* … */ }
}