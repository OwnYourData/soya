"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.factory = exports.serializeJsonLd = exports.parseJsonLd = void 0;
const jsonld_streaming_parser_1 = require("jsonld-streaming-parser");
const jsonld_streaming_serializer_1 = require("jsonld-streaming-serializer");
const rdf_ext_1 = __importDefault(require("rdf-ext"));
exports.factory = rdf_ext_1.default;
const jsonld = __importStar(require("jsonld"));
const soya_1 = require("../services/soya");
const parseJsonLd = (input) => {
    const parser = new jsonld_streaming_parser_1.JsonLdParser({
        ignoreMissingContextLinkHeader: true,
        baseIRI: soya_1.DEFAULT_REPO,
        processingMode: '1.1',
    });
    const str = JSON.stringify(input);
    parser.write(str);
    parser.end();
    return rdf_ext_1.default.dataset().import(parser);
};
exports.parseJsonLd = parseJsonLd;
const serializeJsonLd = (stream, options) => __awaiter(void 0, void 0, void 0, function* () {
    const serializer = new jsonld_streaming_serializer_1.JsonLdSerializer(Object.assign({ compactIds: true }, options));
    const res = yield new Promise((resolve, reject) => {
        let output = '';
        serializer.import(stream)
            .on('data', (chunk) => output += chunk)
            .on('error', (err) => reject(err))
            .on('end', () => resolve(output));
    });
    // without context we can not use library jsonld for further compacting the output
    if (!(options === null || options === void 0 ? void 0 : options.context))
        return res;
    else {
        // jsonld-streaming-serializer does not compact output as small as possible
        // that's why we use package jsonld to compact output even further
        // NOTICE: This is problematic as jsonld does not use streams
        // therefore we lose the memory efficient stream capabilities of jsonld-streaming-serializer
        // but as this cli is not a high-performance tool, we actually don't care :-)
        const obj = JSON.parse(res);
        const compacted = yield jsonld.compact(obj, options.context);
        return JSON.stringify(compacted);
    }
    ;
});
exports.serializeJsonLd = serializeJsonLd;
//# sourceMappingURL=rdf.js.map