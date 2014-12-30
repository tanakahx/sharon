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

var run = function(text) {
    var ret;

    init(text);
    while (at < text.length) {
        ret = eval(read());
        white();
    }
    return ret;
};

var init = function(s) {
    at = 0;
    ch = '';
    text = s;
    next();
    white();
};

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

var read = function() {
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
};

var lambda = function(arg, body, env) {
    var obj = {};
    var arglist = [];
    obj.type = 'lambda';
    while (arg !== null) {
        arglist.push(car(arg));
        arg = cdr(arg);
    }
    obj.arg = arglist;
    obj.function = { car : 'begin', cdr : body};
    return obj;
};

var gsym = {
    'define' : {
        'type' : 'special',
        'function' : function(sexp, env) {
            if (length(sexp) === 0) {
                error("Invalid number of arguments");
            }
            if (typeof car(sexp) === 'object') {
                var name = car(car(sexp));
                var obj = lambda(cdr(car(sexp)), cdr(sexp), env);
                env[name] = obj;
            }
            else {
                var name = car(sexp);
                env[name] = evals(car(cdr(sexp)), env);
            }
        },
    },

    'lambda' : {
        'type' : 'special',
        'function' : function(sexp, env) {
            if (length(sexp) === 0) {
                error("Invalid number of arguments");
            }
            return lambda(car(sexp), cdr(sexp), env);
        },
    },

    'begin' : {
        'type' : 'special',
        'function' : function(sexp, env) {
            var ret = 0;
            while (sexp !== null) {
                ret = evals(car(sexp), env);
                sexp = cdr(sexp);
            }
            return ret;
        },
    },

    'if' : {
        'type' : 'special',
        'function' : function(sexp, env) {
            if (length(sexp) !== 3) {
                error("Invalid number of arguments");
            }
            if (evals(car(sexp), env)) {
                return evals(car(cdr(sexp)), env);
            }
            else {
                return evals(car(cdr(cdr(sexp))), env);
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

    'display' : {
        'type' : 'function',
        'function' : function() {
            console.log(arguments[0]);
            return undefined;
        },
    },

    'incf' : {
        'type' : 'lambda',
        'arg' : ['x'],
        'function' : {
            car : '+',
            cdr : {
                car : 'x',
                cdr : {
                    car : 1,
                    cdr : null,
                },
            }
        }
    },
};

var eval = function(sexp) {
    return evals(sexp, gsym);
};

var evals = function(sexp, env) {
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
        if (/^".*"$/.exec(sexp)) {
            return sexp;
        }
        else {
            return env[sexp];
        }
    }
    else if (typeof sexp === 'object') {
        var _car = car(sexp);
        var _cdr = cdr(sexp);
        if (typeof _car === 'string' || typeof _car === 'object') { // symbol or lambda expression is allowed
            if (_car === '"') {
                error("Illegal function call."); // This cannot be happened
            }
            var symbol = evals(_car, env);
            if (symbol.type === 'function') {
                var sexp = _cdr;
                var arg = [];
                while (sexp !== null) {
                    arg.push(evals(car(sexp), env));
                    sexp = cdr(sexp);
                }
                return symbol.function.apply(this, arg);
            }
            else if (symbol.type === 'special') {
                return symbol.function(cdr(sexp), env);
            }
            else if (symbol.type === 'lambda') {
                var sexp = _cdr;
                var arg = symbol.arg;
                var e = {};
                for (k in env) {
                    e[k] = env[k];
                }
                for (var i = 0; i < arg.length; i++) {
                    e[arg[i]] = evals(car(sexp), env);
                    sexp = cdr(sexp);
                }
                if (sexp !== null) {
                    error("Illegal function call.")
                }
                return evals(symbol.function, e);
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

plan(65);

will(function(){init('-123');  return read();}, -123);
will(function(){init(' -123'); return read();}, -123);
will(function(){init('hello');  return read();}, "hello");
will(function(){init('hello '); return read();}, "hello");
will(function(){init('-123abc'); return read();}, "-123abc");
will(function(){init('(hello world)'); return car(read());}, "hello");
will(function(){init('(hello world)'); return car(cdr(read()));}, "world");
will(function(){init('(hello world)'); return cdr(cdr(read()));}, null);
will(function(){init('(+ 1 2)'); return car(read());}, "+");
will(function(){init('(+ 1 2)'); return car(cdr(read()));}, 1);
will(function(){init('(+ 1 2)'); return car(cdr(cdr(read())));}, 2);
will(function(){init('(+ 1 2)'); return cdr(cdr(cdr(read())));}, null, "end of list");
is(run('(+ 1 2)'), 3, "1 + 2");
is(run('(+)'), 0, "+ with no argument");
is(run('(- 1)'), -1);
is(run('(- 1 2)'), -1);
is(run('(*)'), 1);
is(run('(* 1 2 3)'), 6);
is(run('-123'), -123);
is(run(' -123'), -123);
is(run('\"hello\"'), "\"hello\"");
is(run('\"hello\" '), "\"hello\"");
is(run('(+ 1 (* 2 3))'), 7);
is(run('(+ 1 (* 2 3) 4)'), 11);
is(run('(+ (* 2 3) 4)'), 10);
is(run('(/ 2)'), 1/2);
is(run('(/ 2 3)'), 2/3);
is(run('(/ 2 3 4)'), 2/3/4);
is(run('(= 0 0)'), true);
is(run('(= 0 1)'), false);
is(run('(if (= 0 0) 1 2)'), 1);
is(run('(if (= 0 1) 1 2)'), 2);
is(print(true),  '#t');
is(print(false), '#f');
is(run('#t'), true);
is(run('#f'), false);
is(run('#d10'), 10);
is(run('#D10'), 10);
is(run('#x10'), 16);
is(run('#X10'), 16);
is(run('#b10'), 2);
is(run('#B10'), 2);
is(run('#o10'), 8);
is(run('#O10'), 8);
is(run('#d15'), 15);
is(run('#xF'), 15);
is(run('#b1111'), 15);
is(run('#o17'), 15);
is(run('(if #t 1 2)'), 1);
is(run('(if #f 1 2)'), 2);
is(run('(if #t "True" "False")'), "\"True\"");
is(run('(if #f "True" "False")'), "\"False\"");
is(run('(not #f)'), true);
is(run('(not #t)'), false);
is(run('(not 0)'), false);
is(run('(not "foo")'), false);
will(function(){init('(if #t 1 2)'); return print(read())}, "(if #t 1 2)");
will(function(){init('(define(foo x)(+ x 1))'); return print(read())}, "(define (foo x) (+ x 1))");
is(run('(incf 10)'), 11, "(incf 10)");
is(run('(define (double x) (* x 2)) (double 123)'), 246, "(define (double x) ...)");
is(run('(define (fact n) (if (= n 0) 1 (* n (fact (- n 1))))) (fact 5)'), 120);
is(run('(begin 1 2 3)'), 3);
is(run('((lambda (x) (+ x 1)) 10)'), 11);
is(run('(define foo 1) foo'), 1);
is(run('(define foo 1) (define foo 2) foo'), 2);
