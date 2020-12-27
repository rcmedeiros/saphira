export const saveEnvVar: (name: string, value?: string) => void = (name: string, value?: string): void => {
    if (value) {
        process.env[`${__moduleInfo.name.toUpperCase()}_${name}`] = value;
    } else {
        delete process.env[`${__moduleInfo.name.toUpperCase()}_${name}`];
    }
};

export const deleteEnvVar: (name: string) => void = (name: string): void => saveEnvVar(name);
