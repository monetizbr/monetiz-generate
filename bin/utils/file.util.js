"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeReplacedOutput = void 0;
const fs = require("fs");
const util = require("util");
const ReadFile = util.promisify(fs.readFile);
const writeReplacedOutput = async (path, filename, template, separator, expressions) => {
    let file = await ReadFile(`${__dirname}/../../templates/${template.template}.txt`, "utf-8");
    let output = file;
    expressions.forEach((expression) => {
        output = output.replace(expression.regex, expression.value);
    });
    fs.writeFile(`${path}/${template.dest}/${filename}${separator}${template.template}.${template.ext}`, output, (err) => {
        if (err) {
            console.log("err !!!!", err);
            throw new Error(`Error while ${template.template} file generating : ${err.message}`);
        }
        fs.chmodSync(`${path}/${template.dest}/${filename}${separator}${template.template}.${template.ext}`, parseInt("0777", 8));
    });
};
exports.writeReplacedOutput = writeReplacedOutput;
