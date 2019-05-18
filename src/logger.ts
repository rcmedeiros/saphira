// tslint:disable no-any no-unsafe-any
import fs from 'fs';
import logform from 'logform';
import path from 'path';
import util from 'util';
import winston, { format } from 'winston';
import DailyRotateFile, { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import { DEFAULT_PACKAGE, UTF8 } from './constants/settings';
import { Saphira } from './index';

const stringFormat: Function = (message: any, optionalParams: Array<any>): string =>
    !optionalParams.length ? message : util.format.apply(util.format, [message].concat(optionalParams));

export interface LogOptions {
    dynamoDBTable?: string;
    outputDir?: string;
    force?: boolean;
}

export interface Logger {
    info: Function;
    warn: Function;
    error: Function;
    debug: Function;
    trace: Function;
}

// tslint:disable-next-line:only-arrow-functions
export function setupLogging(logOptions?: LogOptions): Logger {

    const filename: string = path.join(process.cwd(), DEFAULT_PACKAGE);

    const packageJson: Buffer = fs.readFileSync(filename);
    const project: { name: string } = JSON.parse(packageJson.toString(UTF8));
    const transports: Array<Transport> = [new winston.transports.Console({ level: 'silly' })];
    const logFormat: logform.Format = format.combine(
        format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS ZZ' }),
        format.json(),
        format.metadata(),
    );

    logOptions = logOptions || {};

    logOptions.outputDir = logOptions.outputDir ||
        process.env[`${project.name.toUpperCase()}_LOG_FOLDER`] ||
        process.env.LOG_FOLDER ||
        `/var/log/${project.name.toLowerCase()}`;

    // TODO: https://github.com/palantir/tslint/issues/3704

    transports.push(new (DailyRotateFile)({
        // tslint:disable-next-line: object-literal-sort-keys
        format: logFormat,
        level: 'silly',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        filename: `${project.name}-%DATE%.log`,
        dirname: logOptions.outputDir,
    }));

    transports.push(new winston.transports.File({
        // tslint:disable-next-line: object-literal-sort-keys
        format: logFormat,
        level: 'error',
        filename: path.join(logOptions.outputDir, project.name + '-errors.log'),
        handleExceptions: true,
    }));

    const logger: winston.Logger = winston.createLogger({ transports: transports });

    const result: Logger = {
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        trace: console.trace,
    };

    if (logOptions.force || Saphira.PRODUCTION) {
        // TODO: if (logOptions.dynamoDBTable) {

        // }

        console.info = (message?: any, ...optionalParams: Array<any>): void => {
            logger.info(stringFormat(message, optionalParams));
        };

        console.warn = (message?: any, ...optionalParams: Array<any>): void => {
            logger.warn(stringFormat(message, optionalParams));
        };
        console.error = (message?: any, ...optionalParams: Array<any>): void => {
            logger.error(stringFormat(message, optionalParams));
        };

        // TODO: Maybe level down production
        // tslint:disable-next-line:no-console
        console.log = console.info;

        console.debug = (message?: any, ...optionalParams: Array<any>): void => {
            logger.debug(stringFormat(message, optionalParams));
        };
        console.trace = console.debug;
    }

    return result;

}
