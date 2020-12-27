// cSpell: ignore abiword freearc msvideo bzip msword openxmlformats officedocument wordprocessingml fontobject epub opendocument appliction
// cSpell: ignore powerpoint presentationml visio webm webp woff spreadsheetml
export enum MimeType {
    AAC_audio = 'audio/aac',
    AbiWord_document = 'application/x-abiword',
    Archive_document = 'application/x-freearc',
    AVI_Audio_Video_Interleave = 'video/x-msvideo',
    Amazon_Kindle_eBook_format = 'application/vnd.amazon.ebook',
    Any_kind_of_binary_data = 'application/octet-stream',
    Windows_OS2_Bitmap_Graphics = 'image/bmp',
    BZip_archive = 'application/x-bzip',
    BZip2_archive = 'application/x-bzip2',
    CShell_script = 'application/x-csh',
    Cascading_Style_Sheets = 'text/css',
    Comma_separated_values = 'text/csv',
    Microsoft_Word = 'application/msword',
    Microsoft_Word_OpenXML = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    MS_Embedded_OpenType_fonts = 'application/vnd.ms-fontobject',
    Electronic_publication_EPUB = 'application/epub+zip',
    GZip_Compressed_Archive = 'application/gzip',
    Graphics_Interchange_Format_GIF = 'image/gif',
    HyperText_Markup_Language_HTML = 'text/html',
    Icon_format = 'image/vnd.microsoft.icon',
    iCalendar_format = 'text/calendar',
    Java_Archive_JAR = 'application/java-archive',
    JPEG_images = 'image/jpeg',
    JavaScript = 'text/javascript',
    JSON_format = 'application/json',
    JSON_LD_format = 'application/ld+json',
    Musical_Instrument_Digital_Interface_MIDI = 'audio/midi audio/x-midi',
    JavaScript_module = 'text/javascript',
    MP3_audio = 'audio/mpeg',
    MPEG_Video = 'video/mpeg',
    Apple_Installer_Package = 'application/vnd.apple.installer+xml',
    OpenDocument_presentation_document = 'application/vnd.oasis.opendocument.presentation',
    OpenDocument_spreadsheet_document = 'application/vnd.oasis.opendocument.spreadsheet',
    OpenDocument_text_document = 'application/vnd.oasis.opendocument.text',
    OGG_audio = 'audio/ogg',
    OGG_video = 'video/ogg',
    OGG = 'application/ogg',
    Opus_audio = 'audio/opus',
    OpenType_font = 'font/otf',
    Portable_Network_Graphics = 'image/png',
    Adobe_Portable_Document_Format_PDF = 'application/pdf',
    Hypertext_Preprocessor_PHP = 'appliction/php',
    Microsoft_PowerPoint = 'application/vnd.ms-powerpoint',
    Microsoft_PowerPoint_OpenXML = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    RAR_archive = 'application/x-rar-compressed',
    Rich_Text_Format_RTF = 'application/rtf',
    Bourne_shell_script = 'application/x-sh',
    Scalable_Vector_Graphics_SVG = 'image/svg+xml',
    Adobe_Flash_Small_web_format_SWF = 'application/x-shockwave-flash',
    Tape_Archive_TAR = 'application/x-tar',
    Tagged_Image_File_Format_TIFF = 'image/tiff',
    MPEG_transport_stream = 'video/mp2t',
    TrueType_Font = 'font/ttf',
    Text = 'text/plain',
    Microsoft_Visio = 'application/vnd.visio',
    Waveform_Audio_Format = 'audio/wav',
    WEBM_audio = 'audio/webm',
    WEBM_video = 'video/webm',
    WEBP_image = 'image/webp',
    Web_Open_Font_Format_WOFF = 'font/woff',
    Web_Open_Font_Format_2_WOFF2 = 'font/woff2',
    XHTML = 'application/xhtml+xml',
    Microsoft_Excel = 'application/vnd.ms-excel',
    Microsoft_Excel_OpenXML = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    XML_from_applications = 'application/xml',
    XML_from_users = 'text/xml',
    XUL = 'application/vnd.mozilla.xul+xml',
    ZIP_archive = 'application/zip',
    Audio_video_container_3GPP = 'video/3gpp',
    Audio_container_3GPP = 'audio/3gpp',
    Audio_video_container_3GPP2 = 'video/3gpp2',
    Audio_container_3GPP2 = 'audio/3gpp2',
    Archive_7Zip = 'application/x-7z-compressed',
    YAML_from_applications = 'application/yaml',
    YAML_from_users = 'text/yaml',
}

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
