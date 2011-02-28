var FS = require('fs');
JS2.FS = {
  read: function(file) {
    return FS.readFileSync(file, 'utf8');
  },
  
  find: function(dir, ext, recursive) {
    var all = FS.readdirSync(dir);
    var extRegex = new RegExp("\\\\." + ext + "$");
    for (var i=0; i<all.length; i++) {
      var file = dir + '/' + all[i];
      if (file.match(/^\./)) continue;

      if (recursive && FS.statSync(file).isDirectory()) {
        var more = this.find(file, ext, recursive);
        for (var j=0; j<more.length; j++) {
          all.push(more[j]);
        }
      } else if (file.match(extRegex)) {
        all.push(file);
      }
    }
    return all;
 },

 isDiretory: function(file) {
   return FS.statSync(file).isDiretory();
 },

 isFile: function(file) {
   return FS.statSync(file).isFile();
 },


  write: function(file, data) {
    return FS.writeFileSync(file, data);
  },

  mtime: function(file) {
    try {
      var stat = FS.statSync(file);
      return stat.isFile() ? stat.mtime : 0;
    } catch (e)  {
      return 0;
    }
  }
};

