var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import _canonicalize from 'canonicalize';
// @ts-expect-error hashlink has no types
import { encode } from 'hashlink';
import sodium, { from_hex, from_string, to_hex, to_string } from 'libsodium-wrappers';
import { onlyContainsHex } from './utils/core-utils';
export const canonicalize = _canonicalize;
export const createSha256Hex = (value) => __awaiter(void 0, void 0, void 0, function* () {
    // browser environment
    if (typeof globalThis.crypto !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const msgBuffer = new TextEncoder('utf-8').encode(value);
        const hashBuffer = yield crypto.subtle.digest('SHA-256', msgBuffer);
        return to_hex(new Uint8Array(hashBuffer));
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
const sharedSecretHash = createSha256Hex(sharedSecret);
export const encrypt = (text, publicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const cipherMsg = sodium.crypto_box_easy(from_string(text), nonce, from_hex(publicKey), from_hex(yield sharedSecretHash));
    return {
        value: to_hex(cipherMsg),
        nonce: to_hex(nonce),
        version: cryptoVersion,
    };
});
// SEE: https://libsodium.gitbook.io/doc/public-key_cryptography/authenticated_encryption
export const decrypt = (cryptoObject, cipherObject) => __awaiter(void 0, void 0, void 0, function* () {
    const { value, nonce, version } = cryptoObject;
    const { cipher } = cipherObject;
    let { isHashed } = cipherObject;
    if (isHashed === undefined)
        isHashed = false;
    if (!!version && version !== cryptoVersion)
        throw new Error(`The provided crypto version (${version}) does not match our internal crypto version (${cryptoVersion})`);
    const _text = from_hex(value);
    const _nonce = from_hex(nonce);
    const _privKey = from_hex(yield sharedSecretHash);
    // calculates the our private key's public key
    const _pubKey = sodium.crypto_scalarmult_base(_privKey);
    const _cipher = from_hex(isHashed ? cipher : yield createSha256Hex(cipher));
    const decrypted = sodium.crypto_box_open_easy(_text, _nonce, _pubKey, _cipher);
    return to_string(decrypted);
});
export const isEncrypted = (item) => {
    return !!(item.value &&
        onlyContainsHex(item.value) &&
        item.nonce &&
        onlyContainsHex(item.nonce) &&
        item.version);
};
const alpha = 'abcdefghijklmnopqrstuvwxyz';
const numeric = '1234567890';
const allowedChars = `${alpha}${alpha.toUpperCase()}${numeric}`;
export const getRandomString = (size) => {
    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(allowedChars.charAt(Math.floor(Math.random() * allowedChars.length)));
    }
    return arr.join('');
};
const codecs = ['mh-sha2-256', 'mb-base58-btc'];
export const generateHashlink = (data, urls = undefined, meta = undefined) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof data === 'object')
        data = canonicalize(data);
    const hl = yield encode({
        data: (new TextEncoder()).encode(data),
        urls,
        codecs,
        meta
    });
    return hl.split(':')[1];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyeXB0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLGFBQWEsTUFBTSxjQUFjLENBQUM7QUFDekMseUNBQXlDO0FBQ3pDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDbEMsT0FBTyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFckQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQztBQWExQyxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBTyxLQUFhLEVBQW1CLEVBQUU7SUFDdEUsc0JBQXNCO0lBQ3RCLElBQUksT0FBTyxVQUFVLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRTtRQUM1Qyw2REFBNkQ7UUFDN0QsYUFBYTtRQUNiLE1BQU0sU0FBUyxHQUFHLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6RCxNQUFNLFVBQVUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUVwRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsbUJBQW1CO1NBQ2Q7UUFDSCw4REFBOEQ7UUFDOUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7YUFDL0IsTUFBTSxDQUFDLEtBQUssQ0FBQzthQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNsQjtBQUNI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