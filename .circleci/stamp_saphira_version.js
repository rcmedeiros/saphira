/**
 *
 * Script will look for the tag --dev-- in /dist/index.js and replace it by Saphira's
 * current version.
 *
 */


'use strict';
const fs = require('fs');
const path = require('path');

const packageJson = path.join(process.cwd(), 'package.json');
const indexJs = path.join(process.cwd(), 'dist', 'index.js');
/* istanbul ignore else */
if (fs.existsSync(packageJson) && fs.existsSync(indexJs)) {
    const version = JSON.parse(fs.readFileSync(packageJson).toString('utf-8')).version;

    fs.readFile(indexJs, 'utf8', (err, data) => {
        if (err) { console.log(err); }
        const result = data.replace(/--dev--/g, `v${version}`);

        fs.writeFile(indexJs, result, 'utf8', (err) => {
            if (err) console.log(err);
        });
    });
}
