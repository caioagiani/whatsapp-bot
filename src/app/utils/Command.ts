export default abstract class Command<T> {
  abstract async execute(message: T): Promise<void>;
}
