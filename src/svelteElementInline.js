import { tag, isRemarkCompiler, isRemarkParser } from './util.js'
import alphabetical from 'is-alphabetical'

var lessThan = '<'
var questionMark = '?'
var exclamationMark = '!'
var slash = '/'
const openCurly = '{'

const htmlLinkOpenExpression = /^<a /i
const htmlLinkCloseExpression = /^<\/a>/i

export default function svelteInline (options) {
  const parser = this.Parser
  const compiler = this.Compiler

  if (isRemarkParser(parser)) {
    attachParser(parser, options)
  }

  if (isRemarkCompiler(compiler)) {
    attachCompiler(compiler, options)
  }
}

function attachParser (parser, options) {
  const proto = parser.prototype
  const inlineMethods = proto.inlineMethods

  svelteElementInlineTokenizer.locator = locator

  proto.inlineTokenizers.svelteElement = svelteElementInlineTokenizer

  inlineMethods.splice(inlineMethods.indexOf('html'), 0, 'svelteElement')

  function locator (value, fromIndex) {
    return value.indexOf('<', fromIndex)
  }

  function svelteElementInlineTokenizer (eat, value, silent) {
    var self = this
    var length = value.length
    var character
    var subvalue

    if (value.charAt(0) !== lessThan || length < 3) {
      return
    }

    character = value.charAt(1)

    if (
      !alphabetical(character) &&
    character !== questionMark &&
    character !== exclamationMark &&
    character !== slash &&
    character !== openCurly
    ) {
      return
    }

    subvalue = value.match(tag)

    if (!subvalue) {
      return
    }

    /* istanbul ignore if - not used yet. */
    if (silent) {
      return true
    }

    subvalue = subvalue[0]

    if (!self.inLink && htmlLinkOpenExpression.test(subvalue)) {
      self.inLink = true
    } else if (self.inLink && htmlLinkCloseExpression.test(subvalue)) {
      self.inLink = false
    }

    return eat(subvalue)({ type: 'html', value: subvalue })
  }
}

function attachCompiler (compiler) {
  const proto = compiler.prototype

  proto.visitors.inlineSvelteElement = compileInlineSvelteElement

  function compileInlineSvelteElement (node) {
    return node.value
  }
}
