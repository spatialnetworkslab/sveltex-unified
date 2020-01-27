export function isRemarkParser (parser) {
  return Boolean(parser && parser.prototype && parser.prototype.blockTokenizers)
}

export function isRemarkCompiler (compiler) {
  return Boolean(compiler && compiler.prototype && compiler.prototype.visitors)
}
