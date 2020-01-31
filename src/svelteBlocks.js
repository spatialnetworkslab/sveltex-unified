import * as util from './util'

const openCurly = '{'
const closeCurly = '}'

const tab = '\t'
const space = ' '

const hash = '#'
const at = '@'
const colon = ':'
const slash = '/'

export default function svelteBlock (options) {
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
  const blockMethods = proto.blockMethods
  const interruptParagraph = proto.interruptParagraph
  const interruptList = proto.interruptList
  const interruptBlockquote = proto.interruptBlockquote

  proto.blockTokenizers.svelte = svelteBlockTokenizer

  blockMethods.splice(blockMethods.indexOf('fencedCode') + 1, 0, 'svelte')

  // Inject math to interrupt rules
  interruptParagraph.splice(interruptParagraph.indexOf('fencedCode') + 1, 0, [
    'svelte'
  ])
  interruptList.splice(interruptList.indexOf('fencedCode') + 1, 0, ['svelte'])
  interruptBlockquote.splice(interruptBlockquote.indexOf('fencedCode') + 1, 0, [
    'svelte'
  ])

  function svelteBlockTokenizer (eat, value, silent) {
    const length = value.length
    let index = 0
    let nested = 0
    let character
    let subvalue

    // Skip initial spacing.
    while (index < length) {
      character = value.charAt(index)
      if (character !== tab && character !== space) {
        break
      }
      index++
    }

    if (value.charAt(index) !== openCurly) {
      return
    }

    // if the next char is not one of the below it is not a special svelte block
    if ([hash, at, colon, slash].indexOf(value.charAt(index + 1)) === -1) {
      return
    }

    if (silent) {
      return true
    }

    index++

    while (index < length) {
      character = value.charAt(index)
      if (character === openCurly) {
        nested++
      }
      if (character === closeCurly) {
        if (nested === 0) {
          index++
          subvalue = value.slice(0, index)
          return eat(subvalue)({ type: 'html', value: subvalue })
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

  proto.visitors.svelte = compileBlockSvelte

  function compileBlockSvelte (node) {
    return node.value
  }
}
