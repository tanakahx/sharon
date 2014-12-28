var at = 0;
var ch = '';

var error = function (m) {
    
    // Call error when something is wrong.

    throw {
        name:    'SyntaxError',
        message: m,
        at:      at,
        text:    text
    };
};

var init = function(s) {
    at = 0;
    ch = '';
    text = s;
    next();
    white();
}

var next = function (c) {

    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch) {
        error("Expected '" + c + "' instead of '" + ch + "'");
    }

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at += 1;
    return ch;
};

var isNum = function(ch) {
    return /[0-9]/.exec(ch);
};

var isSymbolChar = function(ch) {
    return /[a-zA-Z0-9!\$%&\*\+-\.\/:<=>\?@\^_~]/.exec(ch);
};

var sexp = function() {
    var object = {};
    var string = '';
    
    if (ch === '(') {
        next();
        white();
        object.car = sexp();
    }
    else {
        object.car = atom();
    }
    white();
    if (ch == ')') {
        next();
        object.cdr = null;
    }
    else {
        object.cdr = sexp();
    }
    return object;
};

var white = function () {

    // Skip whitespace.

    while (ch && ch <= ' ') {
        next();
    }
};

var atom = function() {
    
    // Parse a atom value.

    var _at;
    var _ch;

    switch (ch) {
    case '"':
        next();
        return string();
    case '#':
        next();
        return number(); 
    default:
        var sym = symbol();
        var n = +sym;
        return isNaN(n) ? sym : n;
    }
};

var symbol = function() {
    
    // Parse a symbol value.

    var string = '';
    
    if (isSymbolChar(ch)) {
        while (isSymbolChar(ch)) {
            string += ch;
            next();
        }
        return string;
    }
    else {
        error("Bad symbol");
    }
};

var string = function() {

    // Parse a string value.

    var ret = symbol();

    if (ch === '"') {
        next();
        return '"' + ret + '"';
    }
    else {
        error("Bad string");
    }
};

var number = function() {

    // Parse a number sign (#) value.

    var string = '';
    var n;

    while (ch && /[^\s()]/.exec(ch)) {
        string += ch;
        next();
    }
    if (/^[tT]$/.exec(string)) {
        return true;
    }
    else if (/^[fF]$/.exec(string)) {
        return false;
    }
    else if (/^[xX][\da-fA-F]+$/.exec(string)) {
        n = parseInt(string.slice(1), 16);
    }
    else if (/^[dD]\d+$/.exec(string)) {
        n = parseInt(string.slice(1), 10);
    }
    else if (/^[bB][01]+$/.exec(string)) {
        n = parseInt(string.slice(1), 2);
    }
    else if (/^[oO][0-7]+$/.exec(string)) {
        n = parseInt(string.slice(1), 8);
    }
    if (isNaN(n)) {
        error("Bad number");
    }
    return n;
};

var value = function() {
    switch (ch) {
    case '(':
        next();
        white();
        return sexp();
    case '"':
        next();
        return string();
    case "#":
        next();
        return number();
    default:
        return atom();
    }
};

var car = function(sexp) {
    return sexp.car;
};

var cdr = function(sexp) {
    return sexp.cdr;
};

var length = function(sexp) {
    var len = 0;

    while (sexp !== null) {
        len++;
        sexp = cdr(sexp);
    }
    return len;
}

var symtbl = {
    'if' : {
        'type' : 'special',
        'function' : function(sexp) {
            if (length(sexp) !== 3) {
                error("Invalid number of arguments");
            }
            if (eval(car(sexp))) {
                return eval(car(cdr(sexp)));
            }
            else {
                return eval(car(cdr(cdr(sexp))));
            }
        },
    },

    'not' : {
        'type' : 'function',
        'function' : function() {
            if (arguments.length !== 1) {
                error("Invalid number of arguments");
            }
            return (arguments[0] === false) ? true : false;
        },
    },

    '=' : {
        'type' : 'function',
        'function' : function() {
            if (arguments.length < 2) {
                error("Invalid number of arguments");
            }
            else {
                var val = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    if (val !== arguments[i]) {
                        return false;
                    }
                }
                return true;
            }
        },
    },

    '+' : {
        'type' : 'function',
        'function' : function() {
            var ret = 0;
            for (var i = 0; i < arguments.length; i++) {
                ret += arguments[i];
            }
            return ret;
        },
    },

    '-' : {
        'type' : 'function',
        'function' : function() {
            switch (arguments.length) {
            case 0:
                error("Invalid number of arguments");
            case 1:
                return -arguments[0];
            default:
                var ret = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    ret -= arguments[i];
                }
                return ret;
            }
        },
    },

    '*' : {
        'type' : 'function',
        'function' : function() {
            var ret = 1;
            for (var i = 0; i < arguments.length; i++) {
                ret *= arguments[i];
            }
            return ret;
        },
    },

    '/' : {
        'type' : 'function',
        'function' : function() {
            switch (arguments.length) {
            case 0:
                error("Invalid number of arguments");
            case 1:
                return 1 / arguments[0];
            default:
                var ret = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    ret /= arguments[i];
                }
                return ret;
            }
        },
    },
};

var eval = function(sexp) {
    if (sexp === null) {
        return null;
    }
    else if (typeof sexp === 'boolean') {
        return sexp;
    }
    else if (typeof sexp === 'number') {
        return sexp;
    }
    else if (typeof sexp === 'string') {
        return sexp;
    }
    else if (typeof sexp === 'object') {
        var _car = car(sexp);
        var _cdr = cdr(sexp);
        if (typeof _car === 'string') {
            if (_car === '"') {
                error("Illegal function call.");
            }
            else {
                var symbol = symtbl[_car];
                if (symbol.type === 'function') {
                    var sexp = _cdr;
                    var args = [];
                    while (sexp !== null) {
                        if (typeof car(sexp) === 'object') {
                            args.push(eval(car(sexp)));
                        }
                        else {
                            args.push(car(sexp));
                        }
                        sexp = cdr(sexp);
                    }
                    return symbol.function.apply(this, args);
                }
                else if (symbol.type === 'special') {
                    return symbol.function(cdr(sexp));
                }
            }
        }
        else {
            error("Illegal function call.")
        }
    }
    else {
        error("Unkown object type to eval");
    }
};

var print = function(sexp) {
    if (typeof sexp === 'object') {
        return '(' + prints(sexp) + ')';
    }
    else {
        return prints(sexp);
    }
};

var prints = function(sexp) {
    if (sexp === null) {
        return '';
    }
    else if (typeof sexp === 'object') {
        var ret;
        if (typeof sexp.car === 'object') {
            ret = print(sexp.car);
        }
        else {
            ret = prints(sexp.car);
        }
        return (sexp.cdr === null) ? ret : ret + ' ' + prints(sexp.cdr);
    }
    else if (sexp === true) {
        return '#t';
    }
    else if (sexp === false) {
        return '#f';
    }
    else {
        return sexp;
    }
};

// Simple unit test framework supporting TAP

var testcount = 0;

var is = function(got, expected, description) {
    var util = require('util');
    if (got !== expected) {
        util.print("not ");
    }
    util.print("ok ", ++testcount);
    if (description !== undefined) {
        console.log(" - " + description);
    }
    else {
        console.log("");
    }
    if (got !== expected) {
        console.log("# got:      ", got);
        console.log("# expected: ", expected);
    }
};

var will = function(got, expected, description) {
    is(got(), expected, description);
};

var plan = function(count) {
    if (count > 0) {
        console.log("1.." + count);
    }
};

plan(58);

will(function(){init('-123');  return value();}, -123);
will(function(){init(' -123'); return value();}, -123);
will(function(){init('hello');  return value();}, "hello");
will(function(){init('hello '); return value();}, "hello");
will(function(){init('-123abc'); return value();}, "-123abc");
will(function(){init('(hello world)'); return car(value());}, "hello");
will(function(){init('(hello world)'); return car(cdr(value()));}, "world");
will(function(){init('(hello world)'); return cdr(cdr(value()));}, null);
will(function(){init('(+ 1 2)'); return car(value());}, "+");
will(function(){init('(+ 1 2)'); return car(cdr(value()));}, 1);
will(function(){init('(+ 1 2)'); return car(cdr(cdr(value())));}, 2);
will(function(){init('(+ 1 2)'); return cdr(cdr(cdr(value())));}, null, "end of list");
will(function(){init('(+ 1 2)'); return eval(value());}, 3, "1 + 2");
will(function(){init('(+)');     return eval(value());}, 0, "+ with no argument");
will(function(){init('(- 1)');   return eval(value());}, -1);
will(function(){init('(- 1 2)'); return eval(value());}, -1);
will(function(){init('(*)');       return eval(value());}, 1);
will(function(){init('(* 1 2 3)'); return eval(value());}, 6);
will(function(){init('-123');  return eval(value());}, -123);
will(function(){init(' -123'); return eval(value());}, -123);
will(function(){init('hello');  return eval(value());}, "hello");
will(function(){init('hello '); return eval(value());}, "hello");
will(function(){init('(+ 1 (* 2 3))'); return eval(value());}, 7);
will(function(){init('(+ 1 (* 2 3) 4)'); return eval(value());}, 11);
will(function(){init('(+ (* 2 3) 4)'); return eval(value());}, 10);
will(function(){init('(/ 2)'); return eval(value());}, 1/2);
will(function(){init('(/ 2 3)'); return eval(value());}, 2/3);
will(function(){init('(/ 2 3 4)'); return eval(value());}, 2/3/4);
will(function(){init('(= 0 0)'); return eval(value());}, true);
will(function(){init('(= 0 1)'); return eval(value());}, false);
will(function(){init('(if (= 0 0) 1 2)'); return eval(value());}, 1);
will(function(){init('(if (= 0 1) 1 2)'); return eval(value());}, 2);
is(print(true),  '#t');
is(print(false), '#f');
will(function(){init('#t'); return eval(value());}, true);
will(function(){init('#f'); return eval(value());}, false);
will(function(){init('#d10'); return eval(value());}, 10);
will(function(){init('#D10'); return eval(value());}, 10);
will(function(){init('#x10'); return eval(value());}, 16);
will(function(){init('#X10'); return eval(value());}, 16);
will(function(){init('#b10'); return eval(value());}, 2);
will(function(){init('#B10'); return eval(value());}, 2);
will(function(){init('#o10'); return eval(value());}, 8);
will(function(){init('#O10'); return eval(value());}, 8);
will(function(){init('#d15'); return eval(value());}, 15);
will(function(){init('#xF'); return eval(value());}, 15);
will(function(){init('#b1111'); return eval(value());}, 15);
will(function(){init('#o17'); return eval(value());}, 15);
will(function(){init('(if #t 1 2)'); return eval(value());}, 1);
will(function(){init('(if #f 1 2)'); return eval(value());}, 2);
will(function(){init('(if #t "True" "False")'); return eval(value());}, "\"True\"");
will(function(){init('(if #f "True" "False")'); return eval(value());}, "\"False\"");
will(function(){init('(not #f)'); return eval(value());}, true);
will(function(){init('(not #t)'); return eval(value());}, false);
will(function(){init('(not 0)'); return eval(value());}, false);
will(function(){init('(not "foo")'); return eval(value());}, false);
will(function(){init('(if #t 1 2)'); return print(value())}, "(if #t 1 2)");
will(function(){init('(define(foo x)(+ x 1))'); return print(value())}, "(define (foo x) (+ x 1))");
