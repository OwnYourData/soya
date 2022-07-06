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
exports.generateHashlink = exports.getRandomString = exports.isEncrypted = exports.decrypt = exports.encrypt = exports.createSha256Hex = exports.canonicalize = void 0;
const canonicalize_1 = __importDefault(require("canonicalize"));
// @ts-expect-error hashlink has no types
const hashlink_1 = require("hashlink");
const libsodium_wrappers_1 = __importStar(require("libsodium-wrappers"));
const core_utils_1 = require("./utils/core-utils");
exports.canonicalize = canonicalize_1.default;
exports.createSha256Hex = (value) => __awaiter(void 0, void 0, void 0, function* () {
    // browser environment
    if (typeof globalThis.crypto !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const msgBuffer = new TextEncoder('utf-8').encode(value);
        const hashBuffer = yield crypto.subtle.digest('SHA-256', msgBuffer);
        return libsodium_wrappers_1.to_hex(new Uint8Array(hashBuffer));
    }
    // node environment
    else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        return crypto.createHash('sha256')
            .update(value)
            .digest('hex');
    }
});
const cryptoVersion = '0.4';
const sharedSecret = 'auth';
// the hash is created globally, so we don't use computing power to recreate it over and over
const sharedSecretHash = exports.createSha256Hex(sharedSecret);
exports.encrypt = (text, publicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const nonce = libsodium_wrappers_1.default.randombytes_buf(libsodium_wrappers_1.default.crypto_box_NONCEBYTES);
    const cipherMsg = libsodium_wrappers_1.default.crypto_box_easy(libsodium_wrappers_1.from_string(text), nonce, libsodium_wrappers_1.from_hex(publicKey), libsodium_wrappers_1.from_hex(yield sharedSecretHash));
    return {
        value: libsodium_wrappers_1.to_hex(cipherMsg),
        nonce: libsodium_wrappers_1.to_hex(nonce),
        version: cryptoVersion,
    };
});
// SEE: https://libsodium.gitbook.io/doc/public-key_cryptography/authenticated_encryption
exports.decrypt = (cryptoObject, cipherObject) => __awaiter(void 0, void 0, void 0, function* () {
    const { value, nonce, version } = cryptoObject;
    const { cipher } = cipherObject;
    let { isHashed } = cipherObject;
    if (isHashed === undefined)
        isHashed = false;
    if (!!version && version !== cryptoVersion)
        throw new Error(`The provided crypto version (${version}) does not match our internal crypto version (${cryptoVersion})`);
    const _text = libsodium_wrappers_1.from_hex(value);
    const _nonce = libsodium_wrappers_1.from_hex(nonce);
    const _privKey = libsodium_wrappers_1.from_hex(yield sharedSecretHash);
    // calculates the our private key's public key
    const _pubKey = libsodium_wrappers_1.default.crypto_scalarmult_base(_privKey);
    const _cipher = libsodium_wrappers_1.from_hex(isHashed ? cipher : yield exports.createSha256Hex(cipher));
    const decrypted = libsodium_wrappers_1.default.crypto_box_open_easy(_text, _nonce, _pubKey, _cipher);
    return libsodium_wrappers_1.to_string(decrypted);
});
exports.isEncrypted = (item) => {
    return !!(item.value &&
        core_utils_1.onlyContainsHex(item.value) &&
        item.nonce &&
        core_utils_1.onlyContainsHex(item.nonce) &&
        item.version);
};
const alpha = 'abcdefghijklmnopqrstuvwxyz';
const numeric = '1234567890';
const allowedChars = `${alpha}${alpha.toUpperCase()}${numeric}`;
exports.getRandomString = (size) => {
    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(allowedChars.charAt(Math.floor(Math.random() * allowedChars.length)));
    }
    return arr.join('');
};
const codecs = ['mh-sha2-256', 'mb-base58-btc'];
exports.generateHashlink = (data, urls = undefined, meta = undefined) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof data === 'object')
        data = exports.canonicalize(data);
    const hl = yield hashlink_1.encode({
        data: (new TextEncoder()).encode(data),
        urls,
        codecs,
        meta
    });
    return hl.split(':')[1];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyeXB0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0VBQXlDO0FBQ3pDLHlDQUF5QztBQUN6Qyx1Q0FBa0M7QUFDbEMseUVBQXNGO0FBRXRGLG1EQUFxRDtBQUV4QyxRQUFBLFlBQVksR0FBRyxzQkFBYSxDQUFDO0FBYTdCLFFBQUEsZUFBZSxHQUFHLENBQU8sS0FBYSxFQUFtQixFQUFFO0lBQ3RFLHNCQUFzQjtJQUN0QixJQUFJLE9BQU8sVUFBVSxDQUFDLE1BQU0sS0FBSyxXQUFXLEVBQUU7UUFDNUMsNkRBQTZEO1FBQzdELGFBQWE7UUFDYixNQUFNLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsTUFBTSxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFcEUsT0FBTywyQkFBTSxDQUFDLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7S0FDM0M7SUFDRCxtQkFBbUI7U0FDZDtRQUNILDhEQUE4RDtRQUM5RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFakMsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQzthQUMvQixNQUFNLENBQUMsS0FBSyxDQUFDO2FBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQyxDQUFBLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQzVCLDZGQUE2RjtBQUM3RixNQUFNLGdCQUFnQixHQUFHLHVCQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7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