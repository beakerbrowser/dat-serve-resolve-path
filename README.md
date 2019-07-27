# dat-serve-resolve-path

Beaker's method to find the file to serve in dat:// requests

```js
const datServeResolvePath = require('@beaker/dat-serve-resolve-path')

var entry = await datServeResolvePath(archive, manifest, url, acceptHeader)
console.log(entry) /* => {
  path: '...',
  isDirectory(),
  isFile(),
  ...
}
```

Pass in:

 - `archive` The DatArchive to read from.
 - `manifest` The dat archive's dat.json manifest (optional)
 - `url` The request URL (can be pre-parsed by `parse-dat-url`). If passing the URL, include the FULL url (hostname too).
 - `acceptHeader` The request Accept header.

Returns a `Stat` object with the `.path` string added. Will return `null` if no matching file is found.

### In the browser

Run `npm run build` to output `dist.js`. This bundle will set `window.datServeResolvePath()` when included.