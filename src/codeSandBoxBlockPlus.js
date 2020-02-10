import { parse as tokenizeWords } from 'space-separated-tokens'

export default function csbBlockPlus (node, config) {
  const props = tokenizeWords(config)
  const location = props[0]
  const params = props[1]
  let style = props[2]
  if (style === undefined) {
    style = 'width:100%; height:500px; overflow:hidden;'
  }
  // if (node.children.length > 0) {
  //   throw new Error('Codesandbox block should not have any content')
  // }
  node.data.codesandboxplus = {
    tag: 'iframe',
    location: location,
    params: params,
    style: style
  }
}
