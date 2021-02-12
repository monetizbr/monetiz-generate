"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generate = void 0;
const fs = require("fs");
const pluralize = require("pluralize");
const Listr = require("listr");
const inquirer = require("inquirer");
const execa = require("execa");
const camelcase = require("camelcase");
const file_util_1 = require("@utils/file.util");
const string_util_1 = require("@utils/string.util");
const templates = [
    { template: "model", dest: "models", ext: "ts" },
    { template: "controller", dest: "controllers", ext: "ts" },
    { template: "repository", dest: "repositories", ext: "ts" },
    { template: "validation", dest: "validations", ext: "ts" },
    { template: "route", dest: "routes/v1", ext: "ts" },
    { template: "test", dest: "../../test", ext: "js" },
];
const paths = [
    "/src/api/",
    "/src/api/models/",
    "/src/api/controllers/",
    "/src/api/repositories/",
    "/src/api/validations/",
    "/src/api/routes/v1/",
    "/src/config/",
    "/src/database/",
    "/src/env/",
    "/src/servers/",
    "/test/fixtures/",
];
class Generate {
    /**
     * Write files into API directory
     *
     * @param {Iwritable[]} templates
     * @param {string} path
     * @param {string} lowercase
     * @param {string} capitalize
     * @param {string} pluralize
     * @param {string} pluralizeUp
     */
    do(templates, path, lowercase, capitalize, pluralize, pluralizeUp, permissions) {
        const tasks = new Listr([
            {
                title: "Gerando pastas",
                task: () => {
                    paths.map((url) => {
                        fs.mkdir(path + url, { recursive: true }, (err) => {
                            if (err)
                                console.log("err on mkdir recursive", err);
                        });
                        execa("ls");
                    });
                },
            },
            {
                title: "Criando arquivos",
                task: () => {
                    const expressions = [
                        { regex: /{{ENTITY_LOWERCASE}}/gi, value: lowercase },
                        {
                            regex: /{{ENTITY_CAPITALIZE}}/gi,
                            value: camelcase(capitalize, { pascalCase: true }),
                        },
                        { regex: /{{ENTITY_PLURALIZE}}/gi, value: pluralize },
                        {
                            regex: /{{ENTITY_PLURALIZE_UP}}/gi,
                            value: camelcase(pluralizeUp, { pascalCase: true }),
                        },
                        {
                            regex: /{{ENTITY_PERMISSIONS}}/gi,
                            value: permissions.toString(),
                        },
                    ];
                    try {
                        templates.forEach(async (template) => {
                            file_util_1.writeReplacedOutput(path + "/src/api", string_util_1.toHyphen(lowercase), template, ".", expressions);
                        });
                    }
                    catch (e) {
                        process.stdout.write(e.message);
                    }
                },
            },
            {
                title: "Criação de fixtures para testes",
                exitOnError: false,
                task: () => {
                    return execa("touch", [
                        path + "/test/fixtures/" + lowercase + ".js",
                    ]).then((result) => {
                        if (result.stderr) {
                            throw new Error(result.stdout);
                        }
                    });
                },
            },
        ], { concurrent: false });
        tasks
            .run()
            .then((result) => {
            console.log("Done");
        })
            .catch((err) => {
            templates.forEach((template) => {
                fs.unlinkSync(`${path}/src/api/${template.dest}/${string_util_1.toHyphen(lowercase)}.${template.template}.${template.ext}`);
            });
            console.log("");
            console.log("Oh oh ... an error has occurred");
            console.log("");
            console.log(err.message);
        });
    }
    /**
     *
     */
    async ask() {
        let answers = {};
        return new Promise(async (resolve, reject) => {
            Object.assign(answers, await inquirer.prompt([
                {
                    name: "path",
                    message: "Caminho relativo do projeto:",
                    type: "input",
                    validate: async function (input) {
                        if (!fs.existsSync(input)) {
                            return "Projeto não encontrado";
                        }
                        return true;
                    },
                },
            ]));
            Object.assign(answers, await inquirer.prompt([
                {
                    name: "entity",
                    message: "Nome da entidade:",
                    type: "input",
                    validate: async function (input) {
                        if (fs.existsSync(`${answers.path}/src/models/${input}.model.ts`)) {
                            return "Entidade já existe";
                        }
                        return true;
                    },
                },
            ]));
            Object.assign(answers, await inquirer.prompt([
                {
                    name: "permissions",
                    message: "Permissões para acesso:",
                    type: "input",
                    validate: async function (input) {
                        if (!input.toString()) {
                            return "Dado inválido: permissões devem ser do tipo string";
                        }
                        return true;
                    },
                },
            ]));
            resolve(answers);
        });
    }
    async run() {
        const answers = await this.ask();
        const path = string_util_1.pathify(answers.path);
        const capitalize = answers.entity[0].toUpperCase() + answers.entity.substr(1);
        const lowercase = answers.entity;
        const pluralized = pluralize.plural(answers.entity);
        const pluralizedUp = pluralized[0].toUpperCase() + pluralized.substr(1);
        const permissions = answers.permissions.toString();
        this.do(templates, path, lowercase, capitalize, pluralized, pluralizedUp, permissions);
    }
}
exports.Generate = Generate;
Generate.description = "Generate boilerplate for Monetiz Applications using Typescript / Express.js / Typeorm";
