export default class HttpResponse<T> {
  constructor(public readonly body: T, public readonly statusCode: number) {}
}
