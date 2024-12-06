// TODO: rename
export class CustomError {
    err: Error;

    constructor(debugError: Error) {
        this.err = debugError;
    }

    getDebugError(): Error {
        return this.err;
    }
}
