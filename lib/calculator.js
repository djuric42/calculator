/*
 * Some license
 */

(function(window, undefined) {
  // Helper function to add classes to elements
  function addClassToElement(element, cssClass) {
    element.className += " " + cssClass
  }

  // Helper function to remove classes from elements
  function removeClassFromElement(element, cssClass) {
    element.className = element.className.replace(cssClass, '');
  }
  // Helper function to determine whether you should or shouldn't display a calculation on screen
  function displayCalculation(current, other) {
    if(other === undefined) return true;

    if((current === '*' || current === '/') && (other === '*' || other === '/')) {
      return true;
    } else if((current === '+' || current === '-') && (other === '+' || other === '-')) {
      return true;
    } else {
      return false
    }
  }

  function Stack() {
    this.reset();
  };
  Stack.prototype.reset = function() {
    this.stack = [[]];
  }
  Stack.prototype.pop = function() {
    var context = this.stack.pop()
    console.log(context.join(""));
    var value = eval(context.join(""));

    // If the stack is empty push back an empty array
    if(this.stack.length === 0) {
      this.stack.push([]);
    }

    console.log("POP ", value);

    //this.peek().push(value);

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

  function Calculator(element, options) {
    this.boundElement = document.querySelector(element);

    this.options = options;
    if(options === undefined)
      this.options = {};

    this.createElements();

    this.last;
    this.lastOp;

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
    this.operators.push(buttonValue);

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
  Calculator.prototype.createClearButton = function() {
    this.boundElement.querySelector(this.appendingKeyElement).appendChild(this.clearButton);
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
    this.last = value;

    //this.stack.push(value);
  };

  Calculator.prototype.defaultOperator = function(value, stackValue, stack, event) {
    // Add an indicator that it's selected
    addClassToElement(event.srcElement, 'selected')

    // Get the last character from the equation
    var lastChar = this.stack.dpeek();// inputVal[inputVal.length - 1];

    // Only add operator if input is not empty and there is no operator at the last
    if(stackValue !== '') {
      // If last operation is an operator remove it.
      if(this.operators.indexOf(this.lastKey) !== -1) {
        this.stack.dpop();
      } else if(this.last) {
        // Push screen contents on the stack
        this.stack.push(this.last);
      }


      var op = value.replace(/x/g, '*').replace(/÷/g, '/');

      if(this.operators.indexOf(this.lastKey) === -1 && displayCalculation(op, this.lastOp)) {
        this.screen = eval(this.stack.peek().join(""));
      }

      this.stack.push(op);

      this.lastOp = op;

      // Allow minus if the string is empty
    } else if(this.stack.dpeek() == '' && value == '-') {
      // TODO
      // Fix minus
    }

    this.lastKey = value;
  };

  Calculator.prototype.defaultInput = function(value, stackValue, stack, event) {
    var val = value;

    if(val === '.' && !this.decimalAdded) {
      this.decimalAdded = true;

      val = this.stack.dpop() + val;
    } else {
      // Append the number to the last number if it's a number.
      if(this.lastKey !== undefined && this.lastKey.match(/[\d\.]+/)) {
        //val = this.stack.dpop() + val;
        val = this.last += val;
        this.screen = val;
      }
    }

    // If a modifier function is present, the function should take care of the input.
    if(this.modifierFunc) {
      this.modifierFunc.call(this, val);

      // XXX Not sure if this behaviour should be default or if the modifier should take care of resetting it.
      this.modifierFunc = undefined;
    } else {
      //this.stack.push(val);

      this.screen = val;
      this.last = val;
    }
  };

  Calculator.prototype.onKeyClick = function(e) {
    var selectedOperator = this.boundElement.querySelector('.selected');
    if(selectedOperator) {
      removeClassFromElement(selectedOperator, 'selected');
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
    addClassToElement(key, type);

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
        addClassToElement(key, cssClass);
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
    addClassToElement(top, 'top');

    var clear = document.createElement('span');
    addClassToElement(clear, 'clear');
    clear.innerHTML = "C";
    var screen = document.createElement('div');
    addClassToElement(screen, 'screen');
    screen.innerHTML = "0";

    if('hideDefaultClear' in this.options && this.options.hideDefaultClear) {
      // Do something
      //this.createSpacer();
    } else {
      top.appendChild(clear);
    }
    this.clearButton = clear;

    top.appendChild(screen);

    var keys = document.createElement('div');
    addClassToElement(keys, 'keys');
    var func = document.createElement('div');
    addClassToElement(func, 'function-keys');
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
      this.stack.push(this.last);

      this.last = this.stack.pop();
      this.screen = this.last;
    });
    this.defineOperator('÷');

    this.defineInput(7); this.defineInput(8); this.defineInput(9); this.defineOperator("*")
    this.defineInput(4); this.defineInput(5); this.defineInput(6); this.defineOperator("+")
    this.defineInput(1); this.defineInput(2); this.defineInput(3); this.defineOperator("-")
    var tmpOps = ['+', '-', 'x', '÷'];

    this.defineInput(0); this.defineInput(".");
    // Define 'special' behaviour for the eval key.
    this.defineKey('eval', "=", function(value, stackValue, stack, event) {
      // First push screen
      this.stack.push(this.last);

      // Pop result
      this.last = this.stack.pop();
      this.screen = this.last

      this.decimalAdded = false;
      this.lastKey = undefined;
    });

    // Last but not least the default reset button
    this.clearButton.onclick = function(e) {
      _this.screen = '0';
      _this.stack.reset();
      _this.lastKey = undefined;

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

  if(typeof define === 'function' && define.amd) {
    define( 'calculator', [], function() { return Calculator; } );
  }

  if( typeof window === 'object' && typeof window.document === 'object' ) {
    window.Calculator = Calculator;
  }
})(window);

