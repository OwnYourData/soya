var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemCommands = void 0;
const soya_js_1 = require("soya-js");
const _1 = require(".");
const logger_1 = require("./services/logger");
const template_1 = require("./system/template");
const core_1 = require("./utils/core");
const std_1 = require("./utils/std");
const open_1 = __importDefault(require("open"));
const acquire = (params, soya) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No soya structure specified!');
    const flatJsonContent = yield std_1.Std.in();
    if (!flatJsonContent)
        return (0, core_1.exitWithError)('No JSON content provided via stdin!');
    let flatJson;
    try {
        flatJson = JSON.parse(flatJsonContent);
    }
    catch (_a) {
        throw new soya_js_1.Errors.JsonParseError('Could not parse input as JSON!');
    }
    try {
        (0, _1.logNiceConsole)(yield soya.acquire(param1, flatJson));
    }
    catch (e) {
        if (typeof e.response.status === 'number') {
            logger_1.logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
            return (0, core_1.exitWithError)('Could not fetch soya structure from repo!');
        }
        else {
            logger_1.logger.error(`Error: ${e.toString()}`);
            return (0, core_1.exitWithError)('Could not transform flat JSON to JSON-LD!');
        }
    }
});
const template = (params) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No template name specified!');
    (0, template_1.tryPrintTemplate)(param1);
});
const init = (_, soya) => __awaiter(this, void 0, void 0, function* () {
    const yamlContent = yield std_1.Std.in();
    if (!yamlContent)
        return (0, core_1.exitWithError)('No YAML content provided via stdin!');
    (0, _1.logNiceConsole)(yield soya.init(yamlContent));
});
const pull = (params, soya) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No path specified!');
    try {
        (0, _1.logNiceConsole)(yield soya.pull(param1));
    }
    catch (e) {
        logger_1.logger.error('Could not fetch resource from repo!');
        if (typeof e.response.status === 'number') {
            logger_1.logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
        }
    }
});
const push = (_, soya) => __awaiter(this, void 0, void 0, function* () {
    const contentDocument = yield std_1.Std.in();
    if (!contentDocument)
        return (0, core_1.exitWithError)('No content provided via stdin!');
    try {
        const res = yield soya.push(contentDocument);
        (0, _1.logNiceConsole)(res.value);
    }
    catch (e) {
        if (typeof e.message === 'string')
            logger_1.logger.error(e.message);
        return (0, core_1.exitWithError)('Could not push SOyA document');
    }
});
const calculateDri = (_, soya) => __awaiter(this, void 0, void 0, function* () {
    const content = yield std_1.Std.in();
    if (!content)
        return (0, core_1.exitWithError)('No content provided via stdin!');
    try {
        const result = yield soya.calculateDri(content);
        console.log(result.dri);
    }
    catch (e) {
        if (e instanceof soya_js_1.Errors.JsonParseError)
            return (0, core_1.exitWithError)('Could not parse JSON!');
        return (0, core_1.exitWithError)('Could not calculate DRI!');
    }
});
const similar = (_, soya) => __awaiter(this, void 0, void 0, function* () {
    try {
        (0, _1.logNiceConsole)(yield soya.similar(yield std_1.Std.in()));
    }
    catch (e) {
        console.error(e);
        return (0, core_1.exitWithError)('Could not process provided document');
    }
});
const info = (params, soya) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No path specified!');
    try {
        (0, _1.logNiceConsole)(yield soya.info(param1));
    }
    catch (_b) {
        return (0, core_1.exitWithError)('Could not fetch SOyA info');
    }
});
const form = (params, soya) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No path specified!');
    try {
        (0, _1.logNiceConsole)(yield soya.getForm(param1));
    }
    catch (_c) {
        return (0, core_1.exitWithError)('Could not generate SOyA form!');
    }
});
const playground = () => __awaiter(this, void 0, void 0, function* () {
    let queryParam;
    try {
        const input = yield std_1.Std.in();
        if (!input)
            return (0, core_1.exitWithError)('No input JSON-LD specified!');
        queryParam = encodeURIComponent(input);
    }
    catch (_d) {
        return (0, core_1.exitWithError)('Could not URI encode JSON-LD!');
    }
    const url = `https://json-ld.org/playground/#json-ld=${queryParam}`;
    (0, open_1.default)(url);
    console.log(url);
});
const query = (params, soya) => __awaiter(this, void 0, void 0, function* () {
    const [param1] = params;
    if (!param1)
        return (0, core_1.exitWithError)('No path specified!');
    try {
        (0, _1.logNiceConsole)(yield soya.query({
            name: param1,
        }));
    }
    catch (_e) {
        return (0, core_1.exitWithError)('Could not query repo!');
    }
});
exports.systemCommands = {
    acquire,
    template,
    init,
    pull,
    push,
    similar,
    info,
    form,
    playground,
    'calculate-dri': calculateDri,
    query,
};
//# sourceMappingURL=commands.js.map