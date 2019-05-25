export interface HttpResponse {
    body: unknown | Error;
    status: number;
    header: { [idx: string]: string }
}