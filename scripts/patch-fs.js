const fs = require('fs');

if (process.platform === 'win32') {
  const origReadlink = fs.readlink;
  fs.readlink = function(path, options, callback) {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? options : {};
    origReadlink.call(fs, path, opts, (err, res) => {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        return cb(e);
      }
      cb(err, res);
    });
  };

  const origReadlinkSync = fs.readlinkSync;
  fs.readlinkSync = function(path, options) {
    try {
      return origReadlinkSync.call(fs, path, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        throw e;
      }
      throw err;
    }
  };

  if (fs.promises && fs.promises.readlink) {
    const origReadlinkPromise = fs.promises.readlink;
    fs.promises.readlink = async function(path, options) {
      try {
        return await origReadlinkPromise.call(fs.promises, path, options);
      } catch (err) {
        if (err && err.code === 'EISDIR') {
          const e = new Error('EINVAL: invalid argument, readlink');
          e.code = 'EINVAL';
          throw e;
        }
        throw err;
      }
    };
  }
}
