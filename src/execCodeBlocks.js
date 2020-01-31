import visit from 'unist-util-visit'
import { parse as tokenizeWords } from 'space-separated-tokens'

export default function transform () {
  return function transformer (tree) {
    const snippets = []
    const remove = []
    const snippetsModule = []
    const scriptRegex = /<script.?(context=.*module.*)*.?>/
    visit(tree, function (node, index, parent) {
      if (node.type === 'html') {
        if (node.value.indexOf('<script') === 0) {
          // determine if it is context module
          if (node.value.match(scriptRegex)[1] !== undefined) {
            const code = node.value.replace(/(^<script.?(context=.*module.*)*.?>|<\/script>$)/g, '')
            snippetsModule.push(code)
            remove.push(node)
            return visit.SKIP
          } else {
            const code = node.value.replace(/(^<script.?(context=.*module.*)*.?>|<\/script>$)/g, '')
            snippets.push(code)
            remove.push(node)
            return visit.SKIP
          }
        }
      }
      if (node.type === 'code' && node.lang === 'js') {
        const meta = tokenizeWords(node.meta)
        if (meta.indexOf('module') !== -1) {
          const code = node.value
          snippetsModule.push(code)
          remove.push(node)
          return visit.SKIP
        }
        if (meta.indexOf('exec') !== -1) {
          const code = node.value
          snippets.push(code)
          if (meta.indexOf('echo') === -1) {
            remove.push(node)
            return visit.SKIP
          }
        }
      }
      if (node.type === 'code' && node.lang === 'html') {
        const meta = tokenizeWords(node.meta)
        if (meta.indexOf('exec') !== -1) {
          if (meta.indexOf('echo') !== -1) {
            node.data = {
              hProperties: {
                className: ['echo_html']
              }
            }
            const htmlNode = {
              type: 'html',
              value: '<div class="exec_html">' + node.value + '</div>'
            }
            parent.children.splice(index + 1, 0, htmlNode)
          }
        }
      }
    })
    visit(tree, remover)
    function remover (node, index, parent) {
      if (parent && remove.indexOf(node) !== -1) {
        parent.children.splice(index, 1)
        return [visit.SKIP, index]
      }
    }
    if (snippets.length > 0) {
      const scriptNode = {
        type: 'html',
        value: '<script>\n' + snippets.join('\n') + '\n</script>\n'
      }
      tree.children.unshift(scriptNode)
    }
    if (snippetsModule.length > 0) {
      const scriptModuleNode = {
        type: 'html',
        value: '<script context="module">\n' + snippetsModule.join('\n') + '\n</script>\n'
      }
      tree.children.unshift(scriptModuleNode)
    }
  }
}
