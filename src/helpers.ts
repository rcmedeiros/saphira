
export const parseJson: Function = (s: string): object => {
    try {
        return JSON.parse(s);
    } catch (e) {
        console.error('Tried to parse invalid JSON string: ' + s);
        return undefined;
    }
};
