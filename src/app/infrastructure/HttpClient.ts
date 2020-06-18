import HttpResponse from "./HttpResponse";

export default class HttpClient {
  async get<T>(url: string): Promise<HttpResponse<T>> {
    return new HttpResponse({} as T, 405);
  }
}
