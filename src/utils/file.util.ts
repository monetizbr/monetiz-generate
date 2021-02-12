import * as fs from "fs";
import * as util from "util";

import { IReplacement } from "@interfaces/IReplacement.interface";

const ReadFile = util.promisify(fs.readFile);

const writeReplacedOutput = async (
  path: string,
  filename: string,
  template: ITemplate,
  separator: string,
  expressions: IReplacement[]
) => {
  let file = await ReadFile(
    `${__dirname}/../../templates/${template.template}.txt`,
    "utf-8"
  );

  let output = file;

  expressions.forEach((expression: IReplacement) => {
    output = output.replace(expression.regex, expression.value);
  });

  fs.writeFile(
    `${path}/${template.dest}/${filename}${separator}${template.template}.${template.ext}`,
    output,
    (err) => {
      if (err) {
        console.log("err !!!!", err);
        throw new Error(
          `Error while ${template.template} file generating : ${err.message}`
        );
      }
      fs.chmodSync(
        `${path}/${template.dest}/${filename}${separator}${template.template}.${template.ext}`,
        parseInt("0777", 8)
      );
    }
  );
};

export { writeReplacedOutput };
