/*
 * Some license
 */

function Stack() {
  this.reset();
};
Stack.prototype.reset = function() {
  this.stack = [[]];
  this.push(0);
}
Stack.prototype.pop = function() {
  var context = this.stack.pop()
  var value = eval(context.join(""));

  // If the stack is empty push back an empty array
  if(this.stack.length === 0) {
    this.stack.push([]);
  }

  console.log("POP ", value);

  this.peek().push(value);

  return value;
};
Stack.prototype.dpop = function() {
  return this.peek().pop();
};
Stack.prototype.push = function(o) {
  console.log("PSH ", o);

  // Push a new array. Key '(' been pressed
  if(o instanceof Array) {
    this.stack.push([]);
  } else {
    this.peek().push(o);
  }
};
Stack.prototype.peek = function() {
  // Return the stack if there's nothing else
  if(this.stack.length === 0) {
    return this.stack;
  } else {
    return this.stack[this.stack.length - 1];
  }
};
Stack.prototype.dpeek = function() {
  var lstack = this.peek();

  return lstack[lstack.length - 1];
};

function Calculator(element) {
  this.boundElement = document.querySelector(element);
  this.createElements();

  this.keys = this.boundElement.querySelectorAll('span');
  // Default operators
  //this.operators = ['+', '-', 'x', '÷'];
  this.operators = [];
  // Default shortcuts.
  this.shortcuts = ['π'];
  // Default modifiers.
  this.modifiers = ['1/X'];
  // This will determine whether a decimal may be added or not.
  this.decimalAdded = false;
  // The last pressed key
  this.lastKey = undefined;
  // The modifier function. This function will be checked during input
  this.modifierFunc = undefined;

  // Logic stack
  this.stack = new Stack();

  // The element the keys will be added to
  this.appendingKeyElement = '.keys';

  this.initialize();

  // Function keys
  this.appendingKeyElement = '.keys .function-keys';
};
Calculator.prototype.defineOperator = function(buttonValue, callbackOrOptions, opts) {
  this.defineKey('operator', buttonValue, callbackOrOptions, opts);
};
Calculator.prototype.defineInput = function(buttonValue, callbackOrOptions, opts) {
  this.defineKey('input', buttonValue, callbackOrOptions, opts);
};
Calculator.prototype.defineShortcut = function(buttonValue, callbackOrOptions, opts) {
  this.defineKey('shortcut', buttonValue, callbackOrOptions, opts);
};
Calculator.prototype.createSpacer = function() {
  this.defineKey('empty');
}

Object.defineProperty(Calculator.prototype, 'screen', {
  set: function(text) {
    var screen = this.boundElement.querySelector('.screen');

    screen.innerHTML = text;
  },
  get: function() {
    var screen = this.boundElement.querySelector('.screen');

    return screen.innerHTML;
  }
});

Calculator.prototype.defaultShortcut = function(value, stackValue, stack, event) {
  if(this.lastKey !== undefined && this.lastKey.match(/\d+/)) {
    this.stack.dpop();
  }

  var value = value.replace(/π/g, Math.PI);
  this.screen = value;

  this.stack.push(value);
}

Calculator.prototype.defaultOperator = function(value, stackValue, stack, event) {
  // Add an indicator that it's selected
  event.srcElement.classList.add("selected");

  // Get the last character from the equation
  var lastChar = this.stack.dpeek();// inputVal[inputVal.length - 1];

  // Only add operator if input is not empty and there is no operator at the last
  if(stackValue !== '') {
    // If last operation is an operator remove it.
    if(this.operators.indexOf(this.stack.dpeek()) !== -1) {
      this.stack.dpop();
    }

    var op = value.replace(/x/g, '*').replace(/÷/g, '/');

    if(stack.length > 3) {
      var tmpStack = stack.slice(0, stack.length - 1);
      this.screen = eval(tmpStack.join(""));
    }

    this.stack.push(op);

    // Allow minus if the string is empty
  } else if(this.stack.dpeek() == '' && value == '-') {
    // TODO
    //input.innerHTML += value;
  }
};

Calculator.prototype.defaultInput = function(value, stackValue, stack, event) {
  var val = value;

  if(val === '.' && !this.decimalAdded) {
    this.decimalAdded = true;

    val = this.stack.dpop() + val;
  } else {
    // Append the number to the last number if it's a number.
    if(this.lastKey !== undefined && this.lastKey.match(/\d+/)) {
      val = this.stack.dpop() + val;
    }
  }

  // If a modifier function is present, the function should take care of the input.
  if(this.modifierFunc) {
    this.modifierFunc.call(this, val);

    // XXX Not sure if this behaviour should be default or if the modifier should take care of resetting it.
    this.modifierFunc = undefined;
  } else {
    this.stack.push(val);

    this.screen = val;
  }
};

Calculator.prototype.onKeyClick = function(e) {
  var selectedOperator = this.boundElement.querySelector('.selected');
  if(selectedOperator) {
    selectedOperator.classList.remove('selected');
  }
};

Calculator.prototype.onclick = function(value, callback, event, options) {
  if(!options.preventDefault) {
    this.onKeyClick(event);
  }

  callback.call(this, value, this.stack.dpeek(), this.stack.peek(), event);

  this.lastKey = value;

  event.preventDefault();
};

Calculator.prototype.defineKey = function(type, buttonValue, callbackOrOptions, opts) {
  var callback, options;

  if(callbackOrOptions) {
    if(typeof(callbackOrOptions) === 'function') {
      callback = callbackOrOptions
      options = opts;
    } else if(typeof(callbackOrOptions) === 'object') {
      options = callbackOrOptions;
    }
  }

  if(options === undefined) {
    options = {};
  }

  if(callback === undefined && type !== 'empty') {
    switch(type) {
      case 'operator':
        callback = this.defaultOperator;
        break;
      case 'input':
        callback = this.defaultInput;
        break;
      case 'shortcut':
        callback = this.defaultShortcut;
        break;
      case 'empty':
      default:
        throw (new Error("defineKey: No such type '"+type+"' and no callback given (there's no default behaviour implemented given that type!)."));
        break;
    }
  }

  var keysElement = this.boundElement.querySelector(this.appendingKeyElement);
  var key = document.createElement("span");
  key.classList.add(type);

  if(type === 'empty') {
    // Add the empty key
    keysElement.appendChild(key);

    return;
  }

  key.innerHTML = buttonValue;

  if(options.cssClass) {
    if(typeof(options.cssClass) === 'string') {
      options.cssClass = options.cssClass.split(" ");
    }

    for(var i = 0; i < options.cssClass.length; i++) {
      var cssClass = options.cssClass[i];
      key.classList.add(cssClass);
    }
  }

  keysElement.appendChild(key);

  var _this = this;
  key.onclick = function(e) {
    _this.onclick(this.innerHTML, callback, e, options);
  }
};

Calculator.prototype.createElements = function() {
  var top = document.createElement('div');
  top.classList.add('top');

  var clear = document.createElement('span');
  clear.classList.add('clear');
  clear.innerHTML = "C";
  var screen = document.createElement('div');
  screen.classList.add('screen');
  screen.innerHTML = "0";

  top.appendChild(clear);
  top.appendChild(screen);

  var keys = document.createElement('div');
  keys.classList.add('keys');
  var func = document.createElement('div');
  func.classList.add('function-keys');
  keys.appendChild(func);

  var copy = document.createElement('div');
  copy.innerHTML = "Created by Jeffrey Wilcke. Get it at https://github.com/stygeo/calculator";
  copy.style.display = 'none';
  this.boundElement.appendChild(copy);
  this.boundElement.appendChild(top);
  this.boundElement.appendChild(keys);
};

Calculator.prototype.initialize = function() {
  var _this = this;
  // Define the default behaviour of the calculator.
  //[
  //  [7,   8,   9, "÷"],
  //  [4,   5,   6, "*"],
  //  [1,   2,   3, "+"],
  //  [0, ".", "="],
  //]

  // Define PI
  this.defineShortcut('π', {cssClass:'operator'});
  // Define the '(' and ')' ops.
  this.defineKey('operator', '(', function(value, stackValue, stack, event) {
    this.stack.push([]);
  });
  this.defineKey('operator', ')', function(value, stackValue, stack, event) {
    this.screen = this.stack.pop();
  });
  this.defineOperator('÷');

  this.defineInput(7); this.defineInput(8); this.defineInput(9); this.defineOperator("*")
  this.defineInput(4); this.defineInput(5); this.defineInput(6); this.defineOperator("+")
  this.defineInput(1); this.defineInput(2); this.defineInput(3); this.defineOperator("-")
  var tmpOps = ['+', '-', 'x', '÷'];

  this.defineInput(0); this.defineInput(".");
  // Define 'special' behaviour for the eval key.
  this.defineKey('eval', "=", function(value, stackValue, stack, event) {
    console.log(this.stack.stack);
    this.screen = this.stack.pop();

    decimalAdded = false;
  });

  // Last but not least the reset button
  var clear = this.boundElement.querySelector('.clear');
  clear.onclick = function(e) {
    _this.screen = '0';
    _this.stack.reset();

    e.preventDefault();
  };
};

if(typeof jQuery !== 'undefined') {
  jQuery.fn.calculator = function() {
    for(var _i = 0; i < this.length; i++) {
      var _e = this[_i];
      new Calculator(_e);
    }

    return jQuery;
  };
}

if(typeof define !== 'undefined') {
  define([], function() {return Calculator;});
}
