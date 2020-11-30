'use strict'
const fs = require('fs');
const path = require('path');

const writeProperty = (filePath, name, value) => {
    const str = fs.readFileSync(filePath, 'utf-8');
    const lines = str.split('\n');
    const result = [];
    lines.forEach(line => {
        const eq = line.indexOf('=');
        if (eq >= 0 && line.substring(0, eq) === name) {
            result.push(`${name}=${value}`)
        } else {
            result.push(line)
        }
    });
    fs.writeFileSync(filePath, result.join('\n'));
}

const filePath = (arg) => {
    return path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg)
}

const modes = { 'json-to-prop': 7 };

if (!modes[process.argv[2]] || process.argv.length !== modes[process.argv[2]]) {
    console.info(`
usage: node ./replace.js mode [targetPath] target [replacementPath] replacement
    modes:
        - json-to-prop: json property to properties file property
`);
    process.exit(-1);
}

if (process.argv[2] === 'json-to-prop') {
    let json = JSON.parse(fs.readFileSync(filePath(process.argv[3])));
    const jsonPath = process.argv[4].split('.');
    while (jsonPath.length) {
        json = json[jsonPath.shift()];
    }
    writeProperty(filePath(process.argv[5]), process.argv[6], json)
} else {
    console.info(process.argv[2] + ' not yet implemented');
}