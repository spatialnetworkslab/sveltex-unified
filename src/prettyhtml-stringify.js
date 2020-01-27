'use strict'

// adapted from https://github.com/rehypejs/rehype/tree/master/packages/rehype-stringify
// using prettyhtml hast-to-html instead to allow for svelte template syntax

import xtend from 'xtend'
import toHTML from '@starptech/prettyhtml-hast-to-html'

export default function stringify (config) {
  var settings = xtend(config, this.data('settings'))

  this.Compiler = compiler

  function compiler (tree) {
    return toHTML(tree, settings)
  }
}
