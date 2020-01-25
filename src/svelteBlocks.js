const util = require('./util')

export function svelteBlock () {
  const parser = this.Parser
  console.log('active')
  if (util.isRemarkParser(parser)) {
    console.log('parse')
    attachParser(parser)
  }
}

function attachParser (parser) {
  const proto = parser.prototype
  const blockMethods = proto.blockMethods
  const interruptParagraph = proto.interruptParagraph
  const interruptList = proto.interruptList
  const interruptBlockquote = proto.interruptBlockquote

  proto.blockTokenizers.svelte = svelteBlockTokenizer

  blockMethods.splice(blockMethods.indexOf('fencedCode') + 1, 0, 'svelte')

  function svelteBlockTokenizer (eat, value, silent) {
    const regex = /^{#if.*}/
    console.log('tokenize')
    const match = regex.exec(value)
    if (match) {
      if (silent) {
        return true
      }
      return eat(match[0])({
        type: 'text',
        value: match[1]
      })
    }
  }
}
