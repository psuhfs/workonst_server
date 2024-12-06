export enum RequestType {
    GET = "GET",
    POST = "POST",
}

export function fromString(str: string): RequestType | undefined {
    if (Object.values(RequestType).includes(str as RequestType)) {
        return str as RequestType;
    }
    return undefined;
}
