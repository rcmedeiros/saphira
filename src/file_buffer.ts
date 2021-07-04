import { ContentType } from './constants/content_types';

export class FileBuffer {
    private readonly _buffer: Buffer;
    private readonly _fileName: string;
    private readonly _contentType: Array<ContentType>;

    constructor(buffer: Buffer, fileName: string, contentType?: ContentType | Array<ContentType>) {
        this._buffer = buffer;
        this._fileName = fileName;

        if (!contentType) {
            this._contentType = [ContentType.Any_kind_of_binary_data];
        } else if (Array.isArray(contentType)) {
            this._contentType = contentType;
        } else {
            this._contentType = [contentType];
        }
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
