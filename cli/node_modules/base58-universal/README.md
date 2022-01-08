# Base58 Universal Encoder/Decoder _(base58-universal)_

> Encoder/decoder for [The Base58 Encoding Scheme][] for [Node.js][] and Web browsers

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Security

TBD

## Background

This library provides an encoder and decoder for [The Base58 Encoding Scheme][]
using an alphabet popularized by Bitcoin. It works in both [Node.js][] and in
Web browsers with no dependencies.

## Install

- Node.js 8.3+ required.

To install for [Node.js][] or in a Web project using npm:

```
npm install base58-universal
```

To install locally or for development:

```
git clone https://github.com/digitalbazaar/base58-universal.git
cd base58-universal
npm install
```

## Usage

The library can be loaded with CommonJS or ESM:

```js
const {encode, decode} = require('base58-universal');
````

```js
import {encode, decode} from 'base58-universal';
```

### Encoding

* `encode(input[, maxline])`
  * **`input`**: `Uint8Array` - bytes to encode
  * **`maxline`**: `Number` - maximum number of encoded characters per line to
    use, defaults to infinite.
  * Returns a base58 encoded string.

```js
import {encode} from 'base58-universal';

const input1 = Uint8Array([1, 2, 3, 4]);
const encoded1 = encode(input1);
// > 2VfUX

const input2 = Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const encoded2 = encode(input2, 8);
// > 4HUtbHhN\r\n2TkpR
```

### Decoding

* `decode(input)`
  * **`input`**: `String` - string to decode
  * Returns a `Uint8Array` with the decoded bytes.

```js
import {decode} from 'base58-universal';

const input3 = '2VfUX';
const decoded3 = decode(input3);
// > Uint8Array [ 1, 2, 3, 4 ]

const input4 = '4HUtbHhN\r\n2TkpR';
const decoded4 = decode(input4);
// > Uint8Array [
//   1, 2, 3, 4,  5,
//   6, 7, 8, 9, 10
// ]
```

### String Handling

This library uses [Uint8Array][] for encoder input and decoder output.
Conversion to and from strings can be done with a variety of tools.

#### Browser

- [TextEncoder][] and [TextDecoder][] using the [Encoding][] standard.

```js
const input5 = new TextEncoder().encode('abc');
const encoded5 = encode(input5);
// > ZiCa

const decoded6 = decoded(encoded5);
const output6 = new TextDecoder().decode(decoded6);
// > abc
```

#### Node.js

- [util.TextEncoder][] and [util.TextDecoder][] using the [Encoding][]
  standard.
- [Buffer][] `from` and `toString` with encoding options.

```js
// Using TextEncoder/TextDecoder
const {TextEncoder, TextDecoder} = require('util');

const input7 = new TextEncoder().encode('abc');
const encoded7 = encode(input7);
// > ZiCa

const decoded8 = decoded(encoded7);
const output8 = new TextDecoder().decode(decoded8);
// > abc

// Using Buffer (which is a Uint8Array)
const input9 = Buffer.from('616263', 'hex');
const encoded9 = encode(input9);
const decoded9 = decode(encoded9);
Buffer.from(decoded9).toString();
// > abc
Buffer.from(decoded9).toString('hex');
// > 616263
```

## Contribute

Please follow the [Bedrock contributing
guidelines](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md).

PRs accepted.

If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme)
specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar

Encoder/decoder original implementation from
[base-x](https://github.com/cryptocoinjs/base-x) under the MIT License.

[Buffer]: https://nodejs.org/api/buffer.html
[Encoding]: https://encoding.spec.whatwg.org/
[Node.js]: https://nodejs.org/
[TextDecoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
[TextEncoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
[The Base58 Encoding Scheme]: https://github.com/digitalbazaar/base58-spec
[Uint8Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[util.TextDecoder]: https://nodejs.org/api/util.html#util_class_util_textdecoder
[util.TextEncoder]: https://nodejs.org/api/util.html#util_class_util_textencoder
