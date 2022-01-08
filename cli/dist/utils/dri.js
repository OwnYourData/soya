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
exports.calculateBaseUri = void 0;
const url_1 = require("url");
const main_1 = require("vaultifier/dist/main");
const logger_1 = require("../services/logger");
const rdf_1 = require("./rdf");
const tryExtractDriFromUris = (value) => {
    if (typeof value === 'string') {
        try {
            // we only try to extract DRIs from URIs
            new url_1.URL(value);
        }
        catch (_a) {
            // if it's not an URI, we can already stop here
            return value;
        }
        const match = /\/(zQm[1-9A-HJ-NP-Za-km-z]{44})/.exec(value);
        if (match) {
            const dri = match[1];
            return dri;
        }
    }
    // obviously there is no DRI
    return value;
};
const checkForObjectOrArray = (val) => {
    if (val && typeof val === 'object')
        removeDRIsFromObject(val);
    else if (Array.isArray(val))
        removeDRIsFromArray(val);
};
const removeDRIsFromArray = (arr) => {
    for (let i = 0, size = arr.length; i < size; i++) {
        arr[i] = tryExtractDriFromUris(arr[i]);
        checkForObjectOrArray(arr[i]);
    }
};
const removeDRIsFromObject = (obj) => {
    for (const prop in obj) {
        const val = obj[prop] = tryExtractDriFromUris(obj[prop]);
        checkForObjectOrArray(val);
    }
};
const calculateBaseUri = (obj, base) => __awaiter(void 0, void 0, void 0, function* () {
    if (obj.quads) {
        const context = Object.assign({}, obj.json['@context']);
        const serialized = yield (0, rdf_1.serializeJsonLd)(obj.quads.toStream(), {
            context: context,
        });
        obj.json = JSON.parse(serialized);
    }
    // TODO: removed temporarily until we know how to identify layers, bases and instances
    // remove @id from '@graph' (only for instances)
    // if (Array.isArray(obj.json['@graph'])) {
    //   const graphItems = obj.json['@graph'];
    //   for (const item of graphItems) {
    //     delete item['@id'];
    //   }
    // }
    // go through all properties and check if it is a DRI
    // if yes, remove the URL so only the DRI remains
    removeDRIsFromObject(obj.json);
    // remove @base property from document as we have to calculate DRI without @base
    delete obj.json['@context']['@base'];
    // calculate DRI and add it to document
    logger_1.logger.debug(`Generating hashlink from document:`);
    logger_1.logger.debug(main_1.crypto.canonicalize(obj.json));
    const dri = yield main_1.crypto.generateHashlink(obj.json);
    const fullUri = base ? `${base}/${dri}` : dri;
    const baseUri = obj.json['@context']['@base'] = fullUri;
    return {
        dri,
        baseUri
    };
});
exports.calculateBaseUri = calculateBaseUri;
//# sourceMappingURL=dri.js.map