var util = require('./util')

module.exports = svelteInline

const openCurly = 123 // '{'
const closeCurly = 125 // '{'

function svelteInline (options) {
  const parser = this.Parser
  const compiler = this.Compiler

  if (util.isRemarkParser(parser)) {
    attachParser(parser, options)
  }

  if (util.isRemarkCompiler(compiler)) {
    attachCompiler(compiler, options)
  }
}

function attachParser (parser, options) {
  const proto = parser.prototype
  const inlineMethods = proto.inlineMethods

  svelteInlineTokenizer.locator = locator

  proto.inlineTokenizers.svelte = svelteInlineTokenizer

  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'svelte')

  function locator (value, fromIndex) {
    return value.indexOf('{', fromIndex)
  }

  function svelteInlineTokenizer (eat, value, silent) {
    const length = value.length
    let index = 0
    let nested = 0
    let character

    if (value.charCodeAt(index) !== openCurly) {
      return
    }

    index++

    if (silent) {
      return true
    }

    while (index < length) {
      character = value.charCodeAt(index)
      if (character === openCurly) {
        nested++
      }
      if (character === closeCurly) {
        if (nested === 0) {
          index++
          return eat(value.slice(0, index))({
            type: 'html',
            value: value.slice(0, index)
          })
        } else {
          nested--
        }
      }
      index++
    }
  }
}

function attachCompiler (compiler) {
  const proto = compiler.prototype

  proto.visitors.inlineSvelte = compileInlineSvelte

  function compileInlineSvelte (node) {
    return node.value
  }
}
