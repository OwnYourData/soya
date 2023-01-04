// according to https://www.w3.org/TR/xmlschema11-2
const xsTypes = [
  'string',
  'boolean',
  'decimal',
  'float',
  'double',
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

  'normalizedString',
  'token',
  'language',
  'Name',
  'NCName',
  'ENTITY',
  'ID',
  'IDREF',
  'NMTOKEN',
];

// we do this globally to save some runtime
const xsTypesLowerCase = xsTypes.map(x => x.toLowerCase());

export const tryUseXsdDataType = (value: string) : {dataType: string, isXsd: boolean} => {

    const xsdIndex = xsTypesLowerCase.indexOf(value.toLowerCase());
    const isXsd = xsdIndex !== -1;

    const dataType = isXsd ?
      `xsd:${xsTypes[xsdIndex]}` :
      value;

    return {dataType, isXsd};
}
