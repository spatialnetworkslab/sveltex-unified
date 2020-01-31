
import { openCloseTag, isRemarkCompiler, isRemarkParser } from './util.js'

const tab = '\t'
const space = ' '
const lineFeed = '\n'
const lessThan = '<'

const svelteElementOpenExpression = new RegExp(openCloseTag.source + '\\s*$')
const elementCloseExpression = /^$/

export default function svelteElementBlock (options) {
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
  const blockMethods = proto.blockMethods
  const interruptParagraph = proto.interruptParagraph
  const interruptBlockquote = proto.interruptBlockquote

  proto.blockTokenizers.svelteElement = svelteElementBlockTokenizer

  blockMethods.splice(blockMethods.indexOf('html') + 1, 0, 'svelteElement')

  // Inject svelteElement to interrupt rules
  interruptParagraph.splice(interruptParagraph.indexOf('html') + 1, 0, [
    'svelteElement'
  ])
  interruptBlockquote.splice(interruptBlockquote.indexOf('html') + 1, 0, [
    'svelteElement'
  ])

  function svelteElementBlockTokenizer (eat, value, silent) {
    const length = value.length
    let index = 0
    let next
    let line
    let offset
    let character
    let sequence

    const sequences = [
      [svelteElementOpenExpression, elementCloseExpression, false]
    ]

    // Eat initial spacing.
    while (index < length) {
      character = value.charAt(index)

      if (character !== tab && character !== space) {
        break
      }

      index++
    }

    if (value.charAt(index) !== lessThan) {
      return
    }

    next = value.indexOf(lineFeed, index + 1)
    next = next === -1 ? length : next
    line = value.slice(index, next)
    offset = -1
    const count = sequences.length

    while (++offset < count) {
      if (sequences[offset][0].test(line)) {
        sequence = sequences[offset]
        break
      }
    }

    if (!sequence) {
      return
    }

    if (silent) {
      return sequence[2]
    }

    index = next

    if (!sequence[1].test(line)) {
      while (index < length) {
        next = value.indexOf(lineFeed, index + 1)
        next = next === -1 ? length : next
        line = value.slice(index + 1, next)

        if (sequence[1].test(line)) {
          if (line) {
            index = next
          }

          break
        }

        index = next
      }
    }

    const subvalue = value.slice(0, index)

    return eat(subvalue)({ type: 'html', value: subvalue })
  }
}

function attachCompiler (compiler) {
  const proto = compiler.prototype

  proto.visitors.svelte = compileBlockSvelteElement

  function compileBlockSvelteElement (node) {
    return node.value
  }
}
