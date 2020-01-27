const visit = require('unist-util-visit')
const findAndReplace = require('hast-util-find-and-replace')

export default function transform () {
  return function transformer (tree) {
    visit(tree, function (node) {
      if (node.type === 'element' && node.tagName === 'code') {
        findAndReplace(node, {
          '&': '&#38;',
          '{': '&#123;',
          '}': '&#125;',
          '"': '&#34;',
          "'": '&#39;',
          '<': '&#60;',
          '>': '&#62;',
          '`': '&#96;'
        })
      }
    })
  }
}
