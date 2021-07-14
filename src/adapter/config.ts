export interface Config {
    name?: string;
    envVar: string;
    required?: boolean;
    logRequest?: boolean;
    logResponse?: boolean;
}
