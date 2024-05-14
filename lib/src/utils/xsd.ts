// according to https://www.w3.org/TR/xmlschema11-2
export const XS_FLOATING_TYPES = [
  'decimal',
  'float',
  'double',
];

export const XS_INTEGRAL_TYPES = [
  'integer',
  'long',
  'int',
  'short',
  'byte',
  'nonNegativeInteger',
  'positiveInteger',
  'unsignedLong',
  'unsignedInt',
  'unsignedShort',
  'unsignedByte',
  'nonPositiveInteger',
  'negativeInteger',
];

export const XS_TYPES = [
  'string',
  'boolean',

  'duration',
  'dateTime',
  'time',
  'date',
  'gYearMonth',
  'gYear',
  'gMonthDay',
  'gDay',
  'gMonth',
  'hexBinary',
  'base64Binary',
  'anyURI',
  'QName',
  'NOTATION',

  'normalizedString',
  'token',
  'language',
  'Name',
  'NCName',
  'ENTITY',
  'ID',
  'IDREF',
  'NMTOKEN',
]
  .concat(XS_FLOATING_TYPES)
  .concat(XS_INTEGRAL_TYPES);


// we do this globally to save some runtime
const xsTypesLowerCase = XS_TYPES.map(x => x.toLowerCase());

export const tryUseXsdDataType = (value: string): { dataType: string, isXsd: boolean } => {

  const xsdIndex = xsTypesLowerCase.indexOf(value.toLowerCase());
  const isXsd = xsdIndex !== -1;

  const dataType = isXsd ?
    `xsd:${XS_TYPES[xsdIndex]}` :
    value;

  return { dataType, isXsd };
}
