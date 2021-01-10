export default abstract class Command<T> {
  abstract execute(message: T): Promise<any>;
}
