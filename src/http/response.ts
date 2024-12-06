import type {CustomError} from "../errors/error.ts";

export class CustomResponse {
    private readonly response: Response;
    private err?: CustomError;

    constructor(data: Response, error?: CustomError) {
        this.response = data;
        this.err = error;
    }
    public getResponse() {
        return this.response;
    }
}
