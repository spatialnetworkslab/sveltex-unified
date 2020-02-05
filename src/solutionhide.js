import remove from 'unist-util-remove'

export default function hideSolutions () {
  return function transformer (tree, file) {
    if (file.data.frontmatter && file.data.frontmatter.solution === false) {
      remove(tree, test)
    }
  }
}

function test (node) {
  if (node.data && node.data.hProperties && node.data.hProperties.className === 'solutionContent') {
    return true
  }
}
