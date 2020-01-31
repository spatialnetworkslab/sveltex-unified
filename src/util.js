export function isRemarkParser (parser) {
  return Boolean(parser && parser.prototype && parser.prototype.blockTokenizers)
}

export function isRemarkCompiler (compiler) {
  return Boolean(compiler && compiler.prototype && compiler.prototype.visitors)
}

// adapted from https://github.com/remarkjs/remark/blob/master/packages/remark-parse/lib/util/html.js

const attributeName = '[a-zA-Z_:][a-zA-Z0-9:._-]*'
const unquoted = '[^"\'=<>`\\u0000-\\u0020]+'
const singleQuoted = "'[^']*'"
const doubleQuoted = '"[^"]*"'
const attributeValue =
  '(?:' + unquoted + '|' + singleQuoted + '|' + doubleQuoted + ')'
const attribute =
  '(?:\\s+' + attributeName + '(?:\\s*=\\s*' + attributeValue + ')?)*'
const svelteShorthand = '(?:\\s{.*?})*'
const openTag = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + svelteShorthand + '\\s*\\/?>'
const closeTag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>'
const comment = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->'
const processing = '<[?].*?[?]>'
const declaration = '<![A-Za-z]+\\s+[^>]*>'
const cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>'

export const openCloseTag = new RegExp('^(?:' + openTag + '|' + closeTag + ')')
export const tag = new RegExp(
  '^(?:' +
    openTag +
    '|' +
    closeTag +
    '|' +
    comment +
    '|' +
    processing +
    '|' +
    declaration +
    '|' +
    cdata +
    ')'
)
