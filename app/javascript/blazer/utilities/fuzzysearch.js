// https://github.com/bevacqua/fuzzysearch
// Copyright 2015 Nicolas Bevacqua
// MIT License

export function fuzzysearch(needle, haystack) {
  const hlen = haystack.length
  const nlen = needle.length
  if (nlen > hlen) return false
  if (nlen === hlen) return needle === haystack
  outer: for (let i = 0, j = 0; i < nlen; i++) {
    const nch = needle.charCodeAt(i)
    while (j < hlen) {
      if (haystack.charCodeAt(j++) === nch) continue outer
    }
    return false
  }
  return true
}
