import { parse as tokenizeWords } from 'space-separated-tokens'

export default function solution (node, config) {
  const props = tokenizeWords(config)
  const show = props[0]
  if (show === 'show') {
    const originalChildren = {
      type: 'div',
      data: {
        hName: 'div',
        hProperties: {
          className: 'solutionContent'
        }
      },
      children: node.children
    }
    node.data.hProperties = {
      className: 'solution solutionShow'
    }
    const details = {
      type: 'details',
      data: {
        hName: 'details'
      },
      children: []
    }
    const summary = {
      type: 'summary',
      data: {
        hName: 'summary'
      },
      children: [{
        type: 'text',
        value: 'Solution'
      }]
    }
    details.children = [summary].concat(originalChildren)
    node.children = [details]
  }
}
