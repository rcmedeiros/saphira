import { ContentType } from './constants/content_types';

export class FileBuffer {
    private readonly _buffer: Buffer;
    private readonly _fileName: string;
    private readonly _contentType: Array<ContentType>;

    constructor(buffer: Buffer, fileName: string, contentType?: ContentType | Array<ContentType>) {
        this._buffer = buffer;
        this._fileName = fileName;
        this._contentType = !contentType
            ? [ContentType.Any_kind_of_binary_data]
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
