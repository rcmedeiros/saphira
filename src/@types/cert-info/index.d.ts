declare module "cert-info" {
    export interface CertInfo {
        expiresAt: number;
        issuedAt: number;
        subject: string;
    }

    export function info(pem: string): CertInfo;
    export function debug(pem: string): unknown;
}