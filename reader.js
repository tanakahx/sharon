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

var isalnum = function(ch) {
    return ('a' <= ch && ch <= 'z') || ('0' <= ch && ch <= '9');
}

var sexp = function() {
    var object = {};
    var string = '';
    
    if (ch === '(') {
        next();
        white();
        object['car'] = sexp();
    }
    else if (isalnum(ch)) {
        object['car'] = atom();
    }
    white();
    if (ch == ')') {
        next();
        object['cdr'] = null;
    }
    else {
        object['cdr'] = sexp();
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

    if ('a' <= ch && ch <= 'z') {
        return symbol();
    } 
    else if (ch === '"') {
        return string();
    }
    else {
        return number();
    }
};

var symbol = function() {
    
    // Parse a symbol value.

    var string = '';
    
    while ('a' <= ch && ch <= 'z') {
        string += ch;
        next();
    }
    return string;
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

init('-123');
console.log(value() === -123);

init(' -123');
console.log(value() === -123);

init('"hello"');
console.log(value() === '"hello"');

init('"hello" ');
console.log(value() === '"hello"');

init('(hello world)');
var sexp = value();
console.log(sexp['car'] === 'hello');
console.log(sexp['cdr']['car'] === 'world');
console.log(sexp['cdr']['cdr'] === null);
