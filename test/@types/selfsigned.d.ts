declare module 'selfsigned' {
    export interface SelfSignedAttr {
        name: string;
        value: string;
    }
    export interface SelfSignedOptions {
        keySize?: number;
        days?: number;
        algorithm?: string;
        extensions?: Array<{ name: string; cA: boolean }>;
        pkcs7?: boolean;
        clientCertificate?: boolean;
        clientCertificateCN?: string;
    }
    export interface SelfSignedPEMs {
        private: string;
        public: string;
        cert: string;
    }

    export function generate(
        attrs: SelfSignedAttr[],
        options: SelfSignedOptions,
        callBack: (err: Error, pems: SelfSignedPEMs) => void,
    ): void;
}
