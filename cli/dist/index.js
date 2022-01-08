#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const soya_1 = require("./services/soya");
const cmd_1 = require("./utils/cmd");
const std_1 = require("./utils/std");
const transform_1 = require("./overlays/transform");
const logger_1 = require("./services/logger");
const validate_1 = require("./overlays/validate");
const package_1 = require("./utils/package");
const rdf_1 = require("./utils/rdf");
const dri_1 = require("./utils/dri");
const core_1 = require("./utils/core");
const template_1 = require("./system/template");
const yaml2soya_1 = require("./system/yaml2soya");
const overlayPlugins = {
    'transform': new transform_1.SoyaTransform(),
    'validate': new validate_1.SoyaValidate(),
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (cmd_1.cmdArgs.version)
        return console.log(package_1.packageJson.version);
    if (!cmd_1.cmdArgs.default || (!cmd_1.cmdArgs.default && cmd_1.cmdArgs.help))
        return (0, cmd_1.printCliHelp)();
    const { repo, default: [command, param1], } = cmd_1.cmdArgs;
    if (command && cmd_1.cmdArgs.help)
        return (0, cmd_1.printCliHelp)(command);
    const handleSystemCommands = () => __awaiter(void 0, void 0, void 0, function* () {
        switch (command) {
            case 'template':
                if (!param1)
                    return (0, core_1.exitWithError)('No template name specified!');
                (0, template_1.tryPrintTemplate)(param1);
                break;
            case 'init':
                const yamlContent = yield std_1.Std.in();
                if (!yamlContent)
                    return (0, core_1.exitWithError)('No YAML content provided via stdin!');
                const doc = yield (0, yaml2soya_1.yaml2soya)(yamlContent, soya_1.DEFAULT_SOYA_NAMESPACE, soya_1.SoyaService.getInstance().repo);
                console.log(JSON.stringify(doc, undefined, 2));
                break;
            case 'pull':
                if (!param1)
                    return (0, core_1.exitWithError)('No path specified!');
                try {
                    const pulledData = yield soya_1.SoyaService.getInstance().pull(param1);
                    console.log(JSON.stringify(pulledData, undefined, 2));
                }
                catch (e) {
                    logger_1.logger.error('Could not fetch resource from repo!');
                    if (typeof e.response.status === 'number') {
                        logger_1.logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
                    }
                }
                break;
            case 'push':
                const contentDocument = yield std_1.Std.in();
                if (!contentDocument)
                    return (0, core_1.exitWithError)('No content provided via stdin!');
                try {
                    const item = yield soya_1.SoyaService.getInstance().push(contentDocument);
                    logger_1.logger.debug('Pushed item', item);
                    console.log(item.dri);
                }
                catch (_c) {
                    return (0, core_1.exitWithError)('Could not push SOyA document');
                }
                break;
            case 'calculate-dri':
                const content = yield std_1.Std.in();
                if (!content)
                    return (0, core_1.exitWithError)('No content provided via stdin!');
                let json;
                let quads;
                logger_1.logger.debug('Raw input:');
                logger_1.logger.debug(content);
                try {
                    json = JSON.parse(content);
                    quads = yield (0, rdf_1.parseJsonLd)(json);
                }
                catch (_d) {
                    return (0, core_1.exitWithError)('Could not parse JSON!');
                }
                try {
                    const result = yield (0, dri_1.calculateBaseUri)({
                        json,
                        quads,
                    });
                    console.log(result.dri);
                }
                catch (_e) {
                    return (0, core_1.exitWithError)('Could not calculate DRI!');
                }
                break;
            case 'similar':
                try {
                    const res = yield soya_1.SoyaService.getInstance().similar(yield std_1.Std.in());
                    console.log(JSON.stringify(res, undefined, 2));
                }
                catch (e) {
                    console.error(e);
                    return (0, core_1.exitWithError)('Could not process provided document');
                }
                break;
            case 'info':
                if (!param1)
                    return (0, core_1.exitWithError)('No path specified!');
                try {
                    const res = yield soya_1.SoyaService.getInstance().info(param1);
                    console.log(JSON.stringify(res, undefined, 2));
                }
                catch (_f) {
                    return (0, core_1.exitWithError)('Could not fetch SOyA info');
                }
                break;
            default:
                return false;
        }
        return true;
    });
    logger_1.logger.info(`${package_1.packageJson.name} (${package_1.packageJson.version})\n`);
    if (repo)
        soya_1.SoyaService.initialize(new soya_1.SoyaService(repo));
    const isSupported = yield handleSystemCommands();
    if (isSupported)
        return;
    if (!command)
        return (0, core_1.exitWithError)('No command specified!');
    const plugin = overlayPlugins[command];
    if (!plugin)
        return (0, core_1.exitWithError)(`No plugin available for command "${command}"!`);
    if (!param1)
        return (0, core_1.exitWithError)('No DRI specified!');
    let input = yield std_1.Std.in();
    if (!input)
        return (0, core_1.exitWithError)('No input data specified!');
    const layer = yield soya_1.SoyaService.getInstance().pull(param1);
    let parsedInput;
    try {
        parsedInput = JSON.parse(input);
    }
    catch (_a) {
        logger_1.logger.error('Input data is not valid JSON!');
        return;
    }
    logger_1.logger.debug('Overlay:', layer);
    logger_1.logger.debug('Data In:', parsedInput);
    let res;
    try {
        res = yield plugin.run(layer, parsedInput);
    }
    catch (e) {
        logger_1.logger.error(`Plugin "${command}" raised an error: ${e.message}`);
        return;
    }
    logger_1.logger.debug('Data Out:', res);
    let output = res.data;
    try {
        output = JSON.stringify(output, undefined, 2);
    }
    catch (_b) { }
    console.log(output);
    return;
}))();
//# sourceMappingURL=index.js.map