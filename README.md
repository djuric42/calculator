calculator
==========

Modular JavaScript Calculator

It's currently in development. An example may be viewed over here [here](https://stygeo.github.io/calculator). It uses a stack based mechanism.

### Dependencies

None

### Quick howto

Create a new calculator:

```javascript
// Assumes <div id="calculator"></div> somewhere on the page.
new Calculator("#calculator")
// Or if you're using jQuery
$("#calculator").calculator();
```

Defining new behaviour (key)

```javascript
var calc = new Calculator("#calculator")
calc.defineKey('operator', 'X<sup>2</sup>', function(value) {
  // Get the current value of the stack
  var lpop = this.stack.dpop();
  // Calculate new result
  var result = Math.pow(lpop, 2);
  // Push resurt back on the stack
  this.stack.push(result);
  // Display result on screen.
  this.screen = result;
});

```

Defining new behaviour with modifier operator (key)
```javascript
calc.defineKey('operator', 'Y<sup>x</sup>', function() {
  // Create a modifier function. This function will be called once. NUM <Func> NUM
  // Once the second NUM has been pressed the pops the first number of the stack
  // and the second will be passed as argument. 
  // No need to remove the modifier function. It will be handled for you.
  this.modifierFunc = function(input) {
    // Pop
    var lpop = this.stack.dpop();
    // Push new result to the stack
    var result = Math.pow(lpop, input);

    // Display new value.
    this.screen = result;
  };
});
```

A more detailed description will follow.
