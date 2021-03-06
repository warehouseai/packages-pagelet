'use strict';

var path = require('path')
  , fs = require('fs');

/**
 * Really minimal implementation of a data cache sytem. This should not be used
 * in production it merely serves as an example of caching the data to speedup
 * the rendering of the pages.
 *
 * @constructor
 * @param {Object} options Configuration.
 * @api public
 */
function Filecache(options) {
  options = options || {};

  this.directory = options.directory || path.join(__dirname, '/.cache');
  this.fresh = +options.fresh || 500000;
}

/**
 * Get stored data from the disk.
 *
 * @param {String} name The name of the module.
 * @param {Function} fn The callback
 * @api public
 */
Filecache.prototype.get = function get(name, fn) {
  if (process.env.NO_CACHE) return fn();

  fs.readFile(path.join(this.directory, '/'+ name +'.json'), 'utf-8', function (err, data) {
    if (err) return fn(err);

    try { data = JSON.parse(data); }
    catch (e) {
      console.error('Failed to get data because of invalid data %s: %s', name, e.message);
      return fn(e);
    }

    if (data.expire && data.now && data.data) {
      if (Date.now() - data.now > data.expire) return fn();
    }

    fn(undefined, data.data);
  });
};

/**
 * Store a new cache file.
 *
 * @param {String} name The name of the module.
 * @param {Mixed} data Stuff to store.
 * @param {Number} expire Data expiration.
 * @param {Function} fn The callback.
 * @api public
 */
Filecache.prototype.set = function set(name, data, expire, fn) {
  if (process.env.NO_CACHE) return fn();

  data = { expire: expire, data: data, now: Date.now() };

  try { data = JSON.stringify(data, null, 2); }
  catch(e) {
    console.error('Failed to store data because of circular data references in %s: %s', name, e.message);
    return fn(e);
  }

  fs.writeFile(path.join(this.directory, '/'+ name +'.json'), data, fn);
};

//
// Expose the simple cache
//
module.exports = Filecache;
