(function (undefined, JS2) {

  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/;

  var ISTRING_REGEX     = /^(%\{|})([^\\{]*(?:\\.[^\\']*)*)(#\{|})/;
  var ISTRING_REGEX_FIN = /^(%\{|})[^\\"]*(?:\\.[^\\']*)*(})/;

  function comment(str, lexer) {
    var m = str.match(/^\/\/.*/);
    if (m) return m[0];

    var mode = 0;
    for (var i=0; i<str.length; i++) {
      if (str.charAt(i) == '*') {
        mode++;
      } else if (str.charAt(i) == '/' && mode == 1) {
        mode++;
      } else {
        mode = 0;
      }

      if (mode == 2) return str.substr(0,i+1);
    }
  }

  function istring(str, lexer) {
    var tokens = [];
    var m = ISTRING_REGEX.exec(str);

    // found it!
    if (!m) return null;

    if (m[3] == '#{') {
      lexer.tokens.push([ '"' + m[2] + '"+(', IDS.DSTRING ]);

      var curlyCount = 1;
      var res = null;
      lexer.chomp(m[0]);

      while (res = lexer.next(lexer.str)) {
        if (res == -1) return res;
        if (res[0] == '{') {
          ++curlyCount;
        } else if (res[0] == '}') {
          --curlyCount;
        } 

        if (curlyCount == 0) {
          lexer.tokens.push([')+', IDS.DSTRING]);
          istring(lexer.str, lexer);
          break;
        } else {
          lexer.tokens.push(res);
          lexer.chomp(res[0]);
        }
      }
    }

    else if (m[3] == '}') {
      lexer.chomp(m[0]);
      lexer.tokens.push([ '"' + m[2] + '"', IDS.DSTRING ]);
    }

    return -1;
  }

  var TOKENS = [ 
    [ 'COMMENT', "\\/\\/|/\\*", comment ],
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/", function(str) { var m = REGEX_REGEX.exec(str); if (m) return m[0] } ],
    [ 'CLASS', "class" ],
    [ 'SHORT_FUNCT', "->|=>" ],
    [ 'FOREACH', "foreach" ],
    [ 'CURRY', "curry" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'HERE_DOC', "<<[A-Z_]+" ],
    [ 'DSTRING', '"', function(str) { var m = DSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'SSTRING', "'", function(str) { var m = SSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'ISTRING', "%\\{", istring ],
    [ 'OPERATOR', "[^\w]" ]
  ];

  var IDS = {};
  var REGEX_TOKENS = [];
  for (var i=0,token; token=TOKENS[i]; i++) {
    IDS[token[0]] = i;
    REGEX_TOKENS.push("(" + token[1] + ")");
  }

  var PRIMARY_REGEX = new RegExp("^(" + REGEX_TOKENS.join('|') + ")");

  var Tokens = JS2.Class.extend({
    initialize: function() {
      this.tokens = [];
      this.curlyCount = 0;
      this.braceCount = 0;
    },

    peek: function() {
      return this.tokens[0];
    },

    toArray: function() {
      return this.tokens;
    },

    shift: function() {
      var item = this.tokens.shift(item);
      if (item[0] == '{') {
        this.curlyCount++;
      } else if (item[0] == '}') {
        this.curlyCount--;
      } else if (item[0] == '(') {
        this.braceCount++;
      } else if (item[0] == ')') {
        this.braceCount--;
      }
      return item;
    },

    push: function(item) {
      this.tokens.push(item);
    },

    pop: function() {
      return this.tokens.pop();
    },

    freeze: function(obj) {
      obj.curlyCount = this.curlyCount;
      obj.braceCount = this.braceCount;
    },

    isBalancedCurly: function(obj) {
      return obj.curlyCount == this.curlyCount;
    },

    isBalancedBrace: function(obj) {
      return obj.braceCount == this.braceCount;
    },

    empty: function() {
      return this.tokens.length <= 0;
    }

  });

  var Lexer = JS2.Class.extend('Lexer', {
    tokenize: function(str) {
      this.tokens = new Tokens();
      this.str    = str;
      var res;

      while (res = this.next(this.str)) {
        if (res == -1) continue;

        this.tokens.push(res); 
        this.chomp(res[0]);
      }

      return this.tokens;
    },

    chomp: function(str) {
      this.str = this.str.toString().substr(str.length);
    },

    next: function(str) {
      if (str.length == 0) return null;
      var m = PRIMARY_REGEX.exec(str);
      var res   = null;
      var type  = null;

      for (var i=0,token;token=TOKENS[i]; i++) {
        if (m[0] == m[i+2]) {
          res  = token[2] ? token[2](str, this) : m[0];
          type = i;
          if (res) break;
        }
      }

      if (res == -1) return res;
      return res ? [ res, type ] : null;
    }
  });

  Lexer.IDS = IDS;
  JS2.Lexer = Lexer;
})(undefined, JS2);

