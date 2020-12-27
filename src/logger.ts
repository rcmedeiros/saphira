/* istanbul ignore file */
import winston, { format } from 'winston';

import DailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import logform from 'logform';
import path from 'path';
import util from 'util';

export const enum LogLevel {
    off = 'off',
    error = 'error',
    warn = 'warn',
    info = 'info',
    debug = 'debug',
}

export interface LogOptions {
    logLevel?: LogLevel;
    outputDir?: string;
    winston?: boolean;
}

declare type LogFunction = (message?: unknown, ...optionalParams: Array<unknown>) => void;

export interface Loggable {
    info: LogFunction;
    warn: LogFunction;
    error: LogFunction;
    debug: LogFunction;
}

const LOG_FOLDER_KEY_SUFFIX: string = '_LOG_FOLDER';
const DEFAULT_LOG_ROOT: string = '/var/log/';

export class Logger implements Loggable {
    private static instance: Logger;

    private readonly _systemLoggers: Loggable;

    private readonly logger: winston.Logger;
    private readonly logLevel: LogLevel;

    private constructor(logOptions?: LogOptions) {
        logOptions = logOptions || {};

        this.logLevel = logOptions.logLevel || LogLevel.debug;

        this._systemLoggers = {
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
        };

        if (logOptions.winston) {
            const transports: Array<Transport> = [new winston.transports.Console({ level: 'silly' })];
            const logFormat: logform.Format = format.combine(
                format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS ZZ' }),
                format.json(),
                format.metadata(),
            );

            logOptions.outputDir =
                logOptions.outputDir ||
                process.env[__moduleInfo.name.toUpperCase() + LOG_FOLDER_KEY_SUFFIX] ||
                process.env.LOG_FOLDER ||
                DEFAULT_LOG_ROOT + __moduleInfo.name.toLowerCase();

            transports.push(
                new DailyRotateFile({
                    format: logFormat,
                    level: 'silly',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    filename: `${__moduleInfo.name}-%DATE%.log`,
                    dirname: logOptions.outputDir,
                }),
            );
            transports.push(
                new winston.transports.File({
                    format: logFormat,
                    level: 'error',
                    filename: path.join(logOptions.outputDir, `${__moduleInfo.name}-errors.log`),
                    handleExceptions: true,
                }),
            );

            this.logger = winston.createLogger({ transports: transports });

            console.info = this.info;
            console.warn = this.warn;
            console.error = this.error;
            console.debug = this.debug;
            // eslint-disable-next-line no-console
            console.log = this.debug;
        } else {
            this.info = console.info;
            this.warn = console.warn;
            this.error = console.error;
            this.debug = console.debug;
        }

        switch (this.logLevel) {
            case LogLevel.off:
                console.error = (): void => {
                    /* /dev/null */
                };
            /* falls through */
            case LogLevel.error:
                console.warn = (): void => {
                    /* /dev/null */
                };
            /* falls through */
            case LogLevel.warn:
                console.info = (): void => {
                    /* /dev/null */
                };
            /* falls through */
            case LogLevel.info:
                console.debug = (): void => {
                    /* /dev/null */
                };
            /* falls through */
            default:
        }
    }

    public static getInstance(logOptions?: LogOptions): Loggable {
        if (!this.instance) {
            this.instance = new Logger(logOptions);
            return this.instance;
        }
    }

    private readonly stringFormat = (message: unknown, optionalParams: Array<unknown>): string =>
        !optionalParams.length ? message : util.format.apply(util.format, [message].concat(optionalParams));

    public get systemLoggers(): Loggable {
        return this._systemLoggers;
    }

    public info = (message?: unknown, ...optionalParams: Array<unknown>): void => {
        this.logger.info(this.stringFormat(message, optionalParams));
    };

    public warn = (message?: unknown, ...optionalParams: Array<unknown>): void => {
        this.logger.warn(this.stringFormat(message, optionalParams));
    };

    public error = (message?: unknown, ...optionalParams: Array<unknown>): void => {
        this.logger.error(this.stringFormat(message, optionalParams));
    };

    public debug = (message?: unknown, ...optionalParams: Array<unknown>): void => {
        this.logger.debug(this.stringFormat(message, optionalParams));
    };
}
