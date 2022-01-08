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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yaml2soya = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = require("../../services/logger");
const overlays_1 = require("./overlays");
const xsTypes = [
    'string',
    'decimal',
    'integer',
    'float',
    'boolean',
    'date',
    'time',
];
const handleBase = (doc, base) => {
    const { graph } = doc;
    graph.push({
        '@id': base.name,
        '@type': "owl:Class",
        'subClassOf': 'Base',
    });
    for (const attrName in base.attributes) {
        const specifiedDataType = base.attributes[attrName];
        const specifiedDataTypeLC = specifiedDataType.toLowerCase();
        const dataType = xsTypes.indexOf(specifiedDataTypeLC) !== -1 ?
            `xsd:${specifiedDataTypeLC}` :
            specifiedDataType;
        graph.push({
            '@id': attrName,
            '@type': 'owl:DatatypeProperty',
            'domain': base.name,
            'range': dataType,
        });
    }
};
const yaml2soya = (yamlContent, contextUrl, baseUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const yaml = js_yaml_1.default.load(yamlContent);
    if (!yaml || typeof yaml !== 'object') {
        logger_1.logger.error('Can not parse YAML!');
        return;
    }
    const { meta, content } = yaml;
    const doc = {
        "@context": {
            "@version": 1.1,
            "@import": contextUrl,
            "@base": `${baseUrl}/${meta.name}/`,
        },
        graph: [],
    };
    if (meta.namespace && typeof meta.namespace === 'object') {
        for (const nsKey in meta.namespace) {
            doc['@context'][nsKey] = meta.namespace[nsKey];
        }
    }
    if (Array.isArray(content.base))
        for (const base of content.base) {
            handleBase(doc, base);
        }
    if (Array.isArray(content.overlays))
        for (const overlay of content.overlays) {
            (0, overlays_1.handleOverlay)(doc, overlay);
        }
    // this is where the rename of "graph" to "@graph" happens
    const printable = {
        '@context': doc['@context'],
        '@graph': doc.graph,
    };
    return printable;
});
exports.yaml2soya = yaml2soya;
//# sourceMappingURL=index.js.map