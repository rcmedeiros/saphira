import { StringSet } from '../types';
export interface WebOptions {
    /**
     * Enables multipart/form-data encoding. Defaults to false.
     * Use it when uploading files.
     */
    multipart?: boolean;
    /**
     * Forwards request through HTTP(s) proxy.
     * Eg. proxy: 'http://user:pass@proxy.server.com:3128'.
     * For more advanced proxying/tunneling use a custom agent.
     */
    proxy?: string;
    /**
     * Object containing custom HTTP headers for request.
     */
    headers?: StringSet;
    /**
     * When true, sets content type to application/json and sends request body as JSON string,
     * instead of a query string.
     */
    json?: boolean;
    /**
     * If true, sets 'Accept-Encoding' header to 'gzip,deflate',
     * and inflates content if zipped.
     * Defaults to true.
     */
    compressed?: boolean;
    /**
     * For HTTP basic auth.
     */
    username?: string;
    /**
     * For HTTP basic auth. Requires username to be passed, but is optional.
     */
    password?: string;
    /**
     * Sets the 'Content-Type' header.
     * Unset by default, unless you're sending data
     * in which case it's set accordingly to whatever is being sent
     * (application/x-www-form-urlencoded, application/json or multipart/form-data).
     * That is, of course, unless the option is passed,
     * either here or through options.headers.
     */
    content_type?: string;
}
