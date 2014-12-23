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
    return /[a-zA-Z!\$%&\*\+-\.\/:<=>\?@\^_~]/.exec(ch);
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

    if (ch === '"') {
        return string();
    }
    else if (ch === '-' || isNum(ch)) {
        try {
            // Save current parser context.
            _at = at;
            _ch = ch;
            return number();
        }
        catch (e) {
            // Resume parser context.
            at = _at;
            ch = _ch;
            return symbol();
        }
    }
    else {
        return symbol();
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

var number = function () {

    // Parse a number value.

    var number,
        string = '';

    if (ch === '-') {
        string = '-';
        next('-');
    }
    while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
    }
    if (ch === '.') {
        string += '.';
        while (next() && ch >= '0' && ch <= '9') {
            string += ch;
        }
    }
    if (ch === 'e' || ch === 'E') {
        string += ch;
        next();
        if (ch === '-' || ch === '+') {
            string += ch;
            next();
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
    }
    number = +string;
    if (isNaN(number)) {
        error("Bad number");
    } else {
        return number;
    }
};

var string = function() {

    // Parse a string value.

    var ret = symbol();

    if (ch === '"') {
        return '"' + ret + '"';
    }
    else {
        error("Bad string");
    }
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

var symtbl = {
    '+' : function() {
        var ret = 0;
        for (var i = 0; i < arguments.length; i++) {
            ret += arguments[i];
        }
        return ret;
    },

    '-' : function() {
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

    '*' : function() {
        var ret = 1;
        for (var i = 0; i < arguments.length; i++) {
            ret *= arguments[i];
        }
        return ret;
    },
};

var eval = function(sexp) {
    var _car = car(sexp);
    var _cdr = cdr(sexp);
    if (typeof _car === 'string') {
        if (_car === '"') {
            error("Illegal function call.");
        }
        else {
            var func = symtbl[_car];
            var args = toArray(_cdr);
            return func.apply(this, args);
        }
    }
    else {
        error("Illegal function call.")
    }
};

var toArray = function(sexp) {
    var f = function(sexp, acc) {
        if (sexp === null) {
            return acc;
        }
        else {
            acc.push(car(sexp));
            return f(cdr(sexp), acc);
        }
    };
    return f(sexp, [])
};

init('-123');
console.log(value() === -123);

init(' -123');
console.log(value() === -123);

init('"hello"');
console.log(value() === '"hello"');

init('"hello" ');
console.log(value() === '"hello"');

init('(hello world)');
var _sexp = value();
console.log(car(_sexp) === 'hello');
console.log(car(cdr(_sexp)) === 'world');
console.log(cdr(cdr(_sexp)) === null);

init('(+ 1 2)');
_sexp = value();
console.log(car(_sexp) === '+');
console.log(car(cdr(_sexp)) === 1);
console.log(car(cdr(cdr(_sexp))) === 2);
console.log(cdr(cdr(cdr(_sexp))) === null);
console.log(eval(_sexp) == 3);

init('(+)')
console.log(eval(value()) == 0);
init('(+ 1)')

init('(- 1)');
console.log(eval(value()) == -1);

init('(*)')
console.log(eval(value()) == 1);
init('(* 1 2 3)')
console.log(eval(value()) == 6);
