/* global BigInt */
const { csvw, rdf, xsd } = require('./namespaces')
const { termToNTriples: toCanonical } = require('@rdfjs/to-ntriples')

/**
 * Validators registry
 */
class Registry {
  constructor () {
    this.validators = new Map()
  }

  /**
   * Register a new validator for a specific datatype.
   *
   * @param {NamedNode} datatype - Validator datatype
   * @param {Function} validatorFunc - Function to validate the term value.
   *    Takes a term value (string) and returns a boolean describing if the
   *    value is valid in regards to the validator's datatype.
   * @returns {void}
   */
  register (datatype, validatorFunc) {
    this.validators.set(toCanonical(datatype), validatorFunc)
  }

  /**
   * Find validator for a given datatype.
   *
   * @param {NamedNode | null} datatype - The datatype
   * @returns {Function | null} - The validation function, if found. `null`
   *    otherwise.
   */
  find (datatype) {
    if (!datatype) {
      return null
    }

    return this.validators.get(toCanonical(datatype))
  }
}

const validators = new Registry()

validators.register(xsd.anySimpleType, value => true)
validators.register(xsd.anyAtomicType, value => true)
validators.register(xsd.string, value => true)

validators.register(xsd.normalizedString, value => isNormalized(value))

validators.register(xsd.token, value => (
  isNormalized(value) &&
  !value.startsWith(' ') &&
  !value.endsWith(' ') &&
  !value.includes('  ')
))

function isNormalized (value) {
  const forbiddenChars = ['\n', '\r', '\t']
  return !forbiddenChars.some(forbiddenChar => value.includes(forbiddenChar))
}

const languagePattern = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/
validators.register(xsd.language, value => languagePattern.test(value))

const anyURIPattern = /^[^\ufffe\uffff]*$/
validators.register(xsd.anyURI, value => anyURIPattern.test(value))

const signSeg = '(\\+|-)?'
const integerPattern = new RegExp(`^${signSeg}\\d+$`)

validators.register(xsd.integer, value => integerPattern.test(value))

validators.register(xsd.nonNegativeInteger, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('0')
))

validators.register(xsd.positiveInteger, value => (
  integerPattern.test(value) &&
  BigInt(value) > BigInt('0')
))

validators.register(xsd.nonPositiveInteger, value => (
  integerPattern.test(value) &&
  BigInt(value) <= BigInt('0')
))

validators.register(xsd.negativeInteger, value => (
  integerPattern.test(value) &&
  BigInt(value) < BigInt('0')
))

validators.register(xsd.int, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('-2147483647') &&
  BigInt(value) <= BigInt('2147483648')
))

validators.register(xsd.unsignedInt, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('0') &&
  BigInt(value) <= BigInt('4294967295')
))

validators.register(xsd.long, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('-9223372036854775808') &&
  BigInt(value) <= BigInt('9223372036854775807')
))

validators.register(xsd.unsignedLong, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('0') &&
  BigInt(value) <= BigInt('18446744073709551615')
))

validators.register(xsd.short, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('-32768') &&
  BigInt(value) <= BigInt('32767')
))

validators.register(xsd.unsignedShort, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('0') &&
  BigInt(value) <= BigInt('65535')
))

validators.register(xsd.byte, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('-128') &&
  BigInt(value) <= BigInt('127')
))

validators.register(xsd.unsignedByte, value => (
  integerPattern.test(value) &&
  BigInt(value) >= BigInt('0') &&
  BigInt(value) <= BigInt('255')
))

validators.register(xsd.boolean, value => (
  value === '1' ||
  value === 'true' ||
  value === '0' ||
  value === 'false'
))

const decimalSeg = `${signSeg}\\d+(\\.\\d+)?`

const decimalPattern = new RegExp(`^${signSeg}${decimalSeg}$`)
validators.register(xsd.decimal, value => decimalPattern.test(value))

validators.register(xsd.float, validateFloat)
validators.register(xsd.double, validateFloat)

const floatPattern = new RegExp(`^${signSeg}${decimalSeg}((E|e)(\\+|-)?\\d+)?$`)
function validateFloat (value) {
  return (
    value === 'INF' ||
    value === '-INF' ||
    value === 'NaN' ||
    floatPattern.test(value)
  )
}

const dateSignSeg = '-?'
const durationYearSeg = '\\d+Y'
const durationMonthSeg = '\\d+M'
const durationDaySeg = '\\d+D'
const durationHourSeg = '\\d+H'
const durationMinuteSeg = '\\d+M'
const durationSecondSeg = '\\d+(\\.\\d+)?S'
const durationYearMonthSeg = `(${durationYearSeg}(${durationMonthSeg})?|${durationMonthSeg})`
const durationTimeSeg = `T((${durationHourSeg}(${durationMinuteSeg})?(${durationSecondSeg})?)|(${durationMinuteSeg}(${durationSecondSeg})?)|${durationSecondSeg})`
const durationDayTimeSeg = `(${durationDaySeg}(${durationTimeSeg})?|${durationTimeSeg})`
const durationSeg = `${dateSignSeg}P((${durationYearMonthSeg}(${durationDayTimeSeg})?)|${durationDayTimeSeg})`

const durationPattern = new RegExp(`^${durationSeg}$`)
validators.register(xsd.duration, value => durationPattern.test(value))

const dayTimeDurationPattern = new RegExp(`^${dateSignSeg}P${durationDayTimeSeg}$`)
validators.register(xsd.dayTimeDuration, value => dayTimeDurationPattern.test(value))

const yearMonthDurationPattern = new RegExp(`^${dateSignSeg}P${durationYearMonthSeg}$`)
validators.register(xsd.yearMonthDuration, value => yearMonthDurationPattern.test(value))

const yearSeg = `${dateSignSeg}\\d{4}`
const timezoneSeg = '(((\\+|-)\\d{2}:\\d{2})|Z)'
const monthSeg = '\\d{2}'
const daySeg = '\\d{2}'
const dateSeg = `${yearSeg}-${monthSeg}-${daySeg}`
const timeSeg = '\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?'

const dateTimePattern = new RegExp(`^${dateSeg}T${timeSeg}${timezoneSeg}?$`)
validators.register(xsd.dateTime, value => dateTimePattern.test(value))

const dateTimeStampPattern = new RegExp(`^${dateSeg}T${timeSeg}${timezoneSeg}$`)
validators.register(xsd.dateTimeStamp, value => dateTimeStampPattern.test(value))

const datePattern = new RegExp(`^${dateSeg}${timezoneSeg}?$`)
validators.register(xsd.date, value => datePattern.test(value))

const dayPattern = new RegExp(`^${daySeg}${timezoneSeg}?$`)
validators.register(xsd.gDay, value => dayPattern.test(value))

const monthPattern = new RegExp(`^--${monthSeg}${timezoneSeg}?$`)
validators.register(xsd.gMonth, value => monthPattern.test(value))

const monthDayPattern = new RegExp(`^${monthSeg}-${daySeg}${timezoneSeg}?$`)
validators.register(xsd.gMonthDay, value => monthDayPattern.test(value))

const yearPattern = new RegExp(`^${yearSeg}${timezoneSeg}?$`)
validators.register(xsd.gYear, value => yearPattern.test(value))

const yearMonthPattern = new RegExp(`^${yearSeg}-${monthSeg}${timezoneSeg}?$`)
validators.register(xsd.gYearMonth, value => yearMonthPattern.test(value))

const timePattern = new RegExp(`^${timeSeg}${timezoneSeg}?$`)
validators.register(xsd.time, value => timePattern.test(value))

const hexBinaryPattern = /^([0-9a-fA-F]{2})*$/
validators.register(xsd.hexBinary, value => hexBinaryPattern.test(value))

const b64CharSeg = '[A-Za-z0-9+/]'
const b16CharSeg = '[AEIMQUYcgkosw048]'
const b04CharSeg = '[AQgw]'
const b64Seg = `(${b64CharSeg} ?)`
const b16Seg = `(${b16CharSeg} ?)`
const b04Seg = `(${b04CharSeg} ?)`
const b64Padded16Seg = `(${b64Seg}{2}${b16Seg}=)`
const b64Padded8Seg = `(${b64Seg}${b04Seg}= ?=)`
const b64QuadSeg = `(${b64Seg}{4})`
const b64FinalQuadSeg = `(${b64Seg}{3}${b64CharSeg})`
const b64FinalSeg = `(${b64FinalQuadSeg}|${b64Padded16Seg}|${b64Padded8Seg})`
const b64Pattern = new RegExp(`^(${b64QuadSeg}*${b64FinalSeg})?$`)
validators.register(xsd.base64Binary, value => b64Pattern.test(value))

validators.register(csvw.JSON, value => {
  try {
    JSON.parse(value)
    return true
  } catch (e) {
    return false
  }
})

// TODO
validators.register(xsd.NOTATION, value => true)
validators.register(xsd.QName, value => true)
validators.register(xsd.Name, value => true)
validators.register(xsd.NCName, value => true)
validators.register(xsd.ENTITY, value => true)
validators.register(xsd.ID, value => true)
validators.register(xsd.IDREF, value => true)
validators.register(xsd.NMTOKEN, value => true)
validators.register(xsd.ENTITIES, value => true)
validators.register(xsd.IDREFS, value => true)
validators.register(xsd.NMTOKENS, value => true)
validators.register(rdf.XMLLiteral, value => true)
validators.register(rdf.HTML, value => true)

module.exports = validators
