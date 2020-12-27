import { MimeType } from './constants/mime_types';

export class FileBuffer {
    private readonly _buffer: Buffer;
    private readonly _fileName: string;
    private readonly _contentType: Array<MimeType>;

    constructor(buffer: Buffer, fileName: string, contentType?: MimeType | Array<MimeType>) {
        this._buffer = buffer;
        this._fileName = fileName;
        this._contentType = !contentType
            ? [MimeType.Any_kind_of_binary_data]
            : Array.isArray(contentType)
            ? contentType
            : [contentType];
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    get fileName(): string {
        return this._fileName;
    }

    get contentTypeString(): string {
        return this._contentType.join(';');
    }
}
