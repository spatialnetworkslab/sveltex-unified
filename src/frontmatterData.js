import visit from 'unist-util-visit'

export default function copyFrontmatter () {
  return function transformer (tree, file) {
    visit(tree, 'yaml', function (node) {
      file.data.frontmatter = node.data.parsedValue
    })
  }
}
