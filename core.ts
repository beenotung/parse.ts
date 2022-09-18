export type Parser<T> = {
  parse(input: unknown, context: ParserContext): T
}

export type ParserContext = {
  typePrefix?: string
  reasonSuffix?: string
  overrideType?: string
  name?: string
}

export type InvalidInputErrorOptions = {
  name: string | undefined
  typePrefix: string | undefined
  reasonSuffix: string | undefined
  expectedType: string
  reason: string
}
export class InvalidInputError extends Error {
  constructor(options: InvalidInputErrorOptions) {
    let message = `Invalid `
    if (options.typePrefix) {
      message += options.typePrefix + ' '
    }
    message += options.expectedType
    if (options.name) {
      message += ' ' + JSON.stringify(options.name)
    }
    message += ', ' + options.reason
    if (options.reasonSuffix) {
      message += ' ' + options.reasonSuffix
    }
    super(message)
  }
}

function toType(input: unknown): string {
  if (input === null) {
    return 'null'
  }
  if (input === '') {
    return 'empty string'
  }
  if (Number.isNaN(input)) {
    return 'NaN'
  }
  return typeof input
}

export type StringOptions = {
  nonEmpty?: boolean
  minLength?: number
  maxLength?: number
  match?: RegExp
}
export function string(options: StringOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): string {
    let expectedType = context.overrideType || 'string'
    if (options.nonEmpty) {
      if (!expectedType.startsWith('non-empty ')) {
        expectedType = 'non-empty ' + expectedType
      }
      if (input === '') {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got empty string',
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got NaN',
          reasonSuffix: context.reasonSuffix,
        })
      }
      input = String(input)
    }
    if (typeof input !== 'string') {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.minLength === 'number') {
      if (input.length < options.minLength) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'minLength should be ' + options.minLength,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof options.maxLength === 'number') {
      if (input.length > options.maxLength) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'maxLength should be ' + options.maxLength,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (options.match) {
      if (!options.match.test(input)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'should match ' + options.match,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return input
  }
  return { parse, options }
}

let urlRegex = /^(.+?):\/\/(.+?)(\/|$)/
export type UrlOptions = StringOptions & {
  domain?: string
  protocol?: string
}
export function url(options: UrlOptions = {}) {
  let parser = string(options)
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input === '') return ''
    let expectedType = context.overrideType || 'url'
    let url = parser.parse(input, {
      ...context,
      overrideType: expectedType,
    })
    let match = url.match(urlRegex)
    if (!match) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'should contains protocol and domain/host',
        reasonSuffix: context.reasonSuffix,
      })
    }
    let protocol = match[1]
    let domain = match[2]
    if (typeof options.protocol === 'string' && protocol !== options.protocol) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'protocol should be ' + JSON.stringify(options.protocol),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.domain === 'string' && domain !== options.domain) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'domain should be ' + JSON.stringify(options.domain),
        reasonSuffix: context.reasonSuffix,
      })
    }
    return url
  }
  return { parse, options }
}

let emailRegex = /^.+?@(.+)$/
export type EmailOptions = StringOptions & {
  domain?: string
}
export function email(options: EmailOptions = {}) {
  let parser = string(options)
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input === '') return ''
    let expectedType = context.overrideType || 'email'
    let email = parser.parse(input, {
      ...context,
      overrideType: expectedType,
    })
    let match = email.match(emailRegex)
    if (!match) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'should contains "@" and domain',
        reasonSuffix: context.reasonSuffix,
      })
    }
    let domain = match[1]
    if (typeof options.domain === 'string' && domain !== options.domain) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'domain should be ' + JSON.stringify(options.domain),
        reasonSuffix: context.reasonSuffix,
      })
    }
    return email
  }
  return { parse, options }
}

export type NumberOptions = {
  min?: number
  max?: number
}
export function number(options: NumberOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): number {
    let expectedType = context.overrideType || 'number'
    let type = toType(input)
    if (typeof input === 'string') {
      input = +input
    }
    if (typeof input !== 'number') {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + type,
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (Number.isNaN(input)) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + type,
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.min === 'number') {
      if (input < options.min) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'min value should be ' + options.min,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof options.max === 'number') {
      if (input > options.max) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'max value should be ' + options.max,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return input
  }
  return { parse, options }
}

export function float(options: NumberOptions = {}) {
  let parser = number(options)
  function parse(input: unknown, context: ParserContext = {}): number {
    return parser.parse(input, {
      ...context,
      overrideType: context.overrideType || 'float',
    })
  }
  return { parse, options }
}

export function int(options: NumberOptions = {}) {
  let parseNumber = number(options).parse
  function parse(input: unknown, context: ParserContext = {}): number {
    let expectedType = context.overrideType || 'int'
    let value = parseNumber(input, {
      ...context,
      overrideType: expectedType,
    })
    if (Number.isInteger(value)) {
      return value
    }
    throw new InvalidInputError({
      name: context.name,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got floating point number',
      reasonSuffix: context.reasonSuffix,
    })
  }
  return { parse, options }
}

export type ObjectOptions<T extends object> = {
  [P in keyof T]: Parser<T[P]>
}

export function object<T extends object>(
  options: ObjectOptions<T> = {} as any,
) {
  function parse(input: unknown, context: ParserContext = {}): T {
    let name = context.name
    let expectedType = context.overrideType || 'object'
    if (input === null) {
      throw new InvalidInputError({
        name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got null',
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof input !== 'object') {
      throw new InvalidInputError({
        name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix: context.reasonSuffix,
      })
    }
    let object: T = {} as any
    for (let key in options) {
      let valueParser = options[key]
      if (!(key in input)) {
        if (isOptional(valueParser)) {
          continue
        }
        throw new InvalidInputError({
          name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'missing ' + JSON.stringify(key),
          reasonSuffix: context.reasonSuffix,
        })
      }
      let valueInput = input[key as keyof typeof input]
      let value = valueParser.parse(valueInput, {
        name: name ? name + '.' + key : key,
      })
      object[key] = value
    }
    return object
  }
  return { parse, options }
}

export function optional<T>(parser: Parser<T>) {
  return Object.assign(parser, { optional: true })
}

function isOptional(parser: Parser<unknown>): boolean {
  return (parser as any).optional
}

export function nullable<T>(parser: Parser<T>) {
  function parse(input: unknown, context: ParserContext = {}): T | null {
    if (input === null) return null
    let typePrefix = context.typePrefix
    return parser.parse(input, {
      ...context,
      typePrefix: typePrefix ? 'nullable ' + typePrefix : 'nullable',
    })
  }
  return { parse, parser }
}

export function boolean(expectedValue?: boolean) {
  if (expectedValue !== undefined) {
    expectedValue = !!expectedValue
  }
  function parse(input: unknown, context: ParserContext = {}): boolean {
    let expectedType = context.overrideType || 'boolean'
    let value = !!input
    if (typeof expectedValue === 'boolean') {
      if (value !== expectedValue) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got ' + toType(input),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return value
  }
  return { parse, expectedValue }
}

let parseDate = date().parse
export type DateOptions = {
  min?: number | Date | string
  max?: number | Date | string
}
export function date(options: DateOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): Date {
    let expectedType = context.overrideType || 'date'
    function checkDate(value: Date): Date {
      let time = value.getTime()
      if (Number.isNaN(time)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got ' + toType(input),
          reasonSuffix: context.reasonSuffix,
        })
      }
      let rangeNameSuffix = ' of ' + (context.name || 'date')
      if (options.min !== undefined) {
        let min = parseDate(options.min, {
          name: 'min value' + rangeNameSuffix,
        }).getTime()
        if (time < min) {
          throw new InvalidInputError({
            name: context.name,
            typePrefix: context.typePrefix,
            expectedType,
            reason: 'min value should be ' + JSON.stringify(options.min),
            reasonSuffix: context.reasonSuffix,
          })
        }
      }
      if (options.max !== undefined) {
        let max = parseDate(options.max, {
          name: 'max value' + rangeNameSuffix,
        }).getTime()
        if (time > max) {
          throw new InvalidInputError({
            name: context.name,
            typePrefix: context.typePrefix,
            expectedType,
            reason: 'max value should be ' + JSON.stringify(options.max),
            reasonSuffix: context.reasonSuffix,
          })
        }
      }
      return value
    }
    if (input instanceof Date) {
      return checkDate(input)
    }
    if (typeof input === 'number') {
      return checkDate(new Date(input))
    }
    if (typeof input === 'string') {
      return checkDate(new Date(input))
    }
    throw new InvalidInputError({
      name: context.name,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got ' + toType(input),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return { parse, options }
}

export function literal<T>(value: T) {
  function parse(input: unknown, context: ParserContext = {}): T {
    if (input === value) return value
    let expectedType =
      context.overrideType || 'literal ' + JSON.stringify(value)
    throw new InvalidInputError({
      name: context.name,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got ' + toType(input),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return { parse, value }
}

export function values<T>(values: T[]) {
  function parse(input: unknown, context: ParserContext = {}): T {
    for (let value of values) {
      if (input === value) return value
    }
    let expectedType =
      context.overrideType ||
      'enum value of ' + JSON.stringify(context.name || values)
    throw new InvalidInputError({
      name: undefined,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got ' + toType(input),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return { parse, values }
}

export type ArrayOptions = {
  minLength?: number
  maxLength?: number
}
export function array<T>(parser: Parser<T>, options: ArrayOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): T[] {
    let { typePrefix, reasonSuffix } = context
    let expectedType = context.overrideType || 'array'
    if (!Array.isArray(input)) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix,
      })
    }
    if (
      typeof options.minLength === 'number' &&
      input.length < options.minLength
    ) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'minLength should be ' + options.minLength,
        reasonSuffix,
      })
    }
    if (
      typeof options.maxLength === 'number' &&
      input.length > options.maxLength
    ) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'maxLength should be ' + options.maxLength,
        reasonSuffix,
      })
    }
    for (let element of input) {
      parser.parse(element, {
        ...context,
        typePrefix: concat('array of', typePrefix),
        reasonSuffix: concat(reasonSuffix, 'in array'),
      })
    }
    return input
  }
  return { parse, parser, options }
}

/**
 * @description for parsing database auto-increment primary key
 */
export function id() {
  let parser = int({ min: 1 })
  function parse(input: unknown, context: ParserContext = {}): number {
    return parser.parse(input, { ...context, overrideType: 'id' })
  }
  return { parse, parser }
}

function concat(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (a && b) {
    return a + ' ' + b
  }
  return a || b
}
