// TODO: rename
export class CustomError {
  private readonly err: Error;

  constructor(debugError: Error) {
    this.err = debugError;
  }

  getError(): Error {
    return this.err;
  }
}
