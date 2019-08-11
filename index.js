const {join} = require('path')
const parseDatUrl = require('parse-dat-url')

/**
 * @description
 * For a given HTTP accept header, provide a list of file-extensions to try.
 * @param {string | undefined} accept
 * @returns {string[]}
 */
function acceptHeaderExtensions (accept) {
  var exts = []
  var parts = (accept || '').split(',')
  if (parts.includes('text/html') || (parts.length === 1 && parts[0] === '*/*')) exts = exts.concat(['.html', '.md'])
  if (parts.includes('text/css')) exts.push('.css')
  if (parts.includes('image/*') || parts.includes('image/apng')) exts = exts.concat(['.png', '.jpg', '.jpeg', '.gif'])
  return exts
}

/**
 * @description
 * For a given archive, dat.json, request url, and request Accept header, find the file to serve
 * @param {Object} archive the dat archive to read from
 * @param {Object|undefined} manifest the dat archive's dat.json manifest
 * @param {string|Object} url the request URL (can be pre-parsed by parse-dat-url)
 * @param {string} acceptHeader the request Accept header
 * @returns {Promise<Object>} returns the Stat object with .path added
 */
module.exports = async function (archive, manifest, url, acceptHeader) {
  // parse path
  var urlp = typeof url === 'string' ? parseDatUrl(url, true) : url
  var filepath = decodeURIComponent(urlp.path)
  if (!filepath) filepath = '/'
  if (filepath.indexOf('?') !== -1) filepath = filepath.slice(0, filepath.indexOf('?')) // strip off any query params
  var hasTrailingSlash = filepath.endsWith('/')

  // lookup entry
  var entry
  const tryStat = async (path) => {
    // abort if we've already found it
    if (entry) return
    // apply the web_root config
    if (manifest && manifest.web_root && !urlp.query.disable_web_root) {
      if (path) {
        path = join(manifest.web_root, path)
      } else {
        path = manifest.web_root
      }
    }
    // attempt lookup
    try {
      entry = await archive.stat(path)
      entry.path = path
    } catch (e) {}
  }

  // do lookup
  if (hasTrailingSlash) {
    await tryStat(filepath + 'index.html')
    await tryStat(filepath + 'index.md')
    await tryStat(filepath)
  } else {
    await tryStat(filepath)
    for (let ext of acceptHeaderExtensions(acceptHeader)) {
      // fallback to different requested headers
      await tryStat(filepath + ext)
    }
    if (entry && entry.isDirectory()) {
      // unexpected directory, give the .html fallback a chance
      let dirEntry = entry
      entry = null
      await tryStat(filepath + '.html') // fallback to .html
      if (dirEntry && !entry) {
        // no .html fallback found, stick with directory that we found
        entry = dirEntry
      }
    }
  }

  // check for a fallback page
  const useFallback = Boolean(manifest && manifest.fallback_page && !urlp.query.disable_fallback_page)
  if (useFallback && (!entry || entry.isDirectory())) {
    let tmp = entry; entry = null
    await tryStat(manifest.fallback_page)
    if (!entry) entry = tmp
  }

  return entry
}