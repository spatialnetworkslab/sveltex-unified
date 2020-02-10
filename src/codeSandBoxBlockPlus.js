import { parse as tokenizeWords } from 'space-separated-tokens'

export default function csbBlockPlus (node, config) {
  const props = tokenizeWords(config)
  const [location, params, style, ranges = ''] = props
  node.data.codesandboxplus = {
    tag: 'iframe',
    location,
    params,
    style: style === 'default' ? 'width:100%; height:500px; overflow:hidden;' : style,
    ranges: [].concat(ranges.split(','))
  }
}
