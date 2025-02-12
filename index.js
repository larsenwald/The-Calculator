let expression = [];
let cursorPos = 0;
let isSoundEnabled = true;

const sounds = {
  parentheses: new Audio('sounds/parentheses.mp3'),
  equals: new Audio('sounds/equals.mp3'),
  pops: Array.from({length: 8}, (_, i) => new Audio(`sounds/pop${i + 1}.mp3`))
};

document.getElementById('soundToggle').addEventListener('change', function(e) {
  isSoundEnabled = e.target.checked;
});

function playSound(type) {
  if (!isSoundEnabled) return;
  
  if (type === 'parentheses') {
    sounds.parentheses.currentTime = 0;
    sounds.parentheses.play();
  } else if (type === 'equals') {
    sounds.equals.currentTime = 0;
    sounds.equals.play();
  } else {
    const randomPop = sounds.pops[Math.floor(Math.random() * sounds.pops.length)];
    randomPop.currentTime = 0;
    randomPop.play();
  }
}

function updateDisplay() {
  const display = document.getElementById("display");
  display.innerHTML = expression
    .map(
      (char, index) =>
        `<span class="char-box ${
          index === cursorPos ? "current-char" : ""
        }">${char}</span>`
    )
    .join("");

  highlightMatchingParens();
}

function highlightMatchingParens() {
  const currentChar = expression[cursorPos];
  if (currentChar === "(" || currentChar === ")") {
    const matchIndex = findMatchingParen(cursorPos);
    if (matchIndex !== -1) {
      const spans = document.getElementsByClassName("char-box");
      spans[cursorPos].classList.add("paren-highlight");
      spans[matchIndex].classList.add("paren-highlight");
    }
  }
}

function findMatchingParen(pos) {
  const target = expression[pos];
  const direction = target === "(" ? 1 : -1;
  let balance = 0;

  for (let i = pos; i >= 0 && i < expression.length; i += direction) {
    if (expression[i] === "(") balance += direction;
    if (expression[i] === ")") balance -= direction;
    if (balance === 0) return i;
  }
  return -1;
}

function insertNumber(num) {
  playSound('default');
  expression.splice(cursorPos, 0, num);
  cursorPos++;
  updateDisplay();
}

function insertOperator(op) {
  playSound('default');
  expression.splice(cursorPos, 0, op);
  cursorPos++;
  updateDisplay();
}

function insertParens() {
  playSound('parentheses');
  expression.splice(cursorPos, 0, "(", ")");
  cursorPos++;
  updateDisplay();
}

function handleBackspace() {
  playSound('default');
  if (cursorPos > 0) {
    expression.splice(cursorPos - 1, 1);
    cursorPos--;
    updateDisplay();
  }
}

function moveCursor(offset) {
  playSound('default');
  cursorPos = Math.max(
    0,
    Math.min(expression.length, cursorPos + offset)
  );
  updateDisplay();
}

function clearAll() {
  playSound('default');
  expression = [];
  cursorPos = 0;
  updateDisplay();
}

function getPrecedence(operator) {
  switch (operator) {
    case "+":
    case "-":
      return 1;
    case "*":
    case "/":
      return 2;
    default:
      return 0;
  }
}

function isOperator(token) {
  return ["+", "-", "*", "/"].includes(token);
}

function applyOperator(operator, b, a) {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return a / b;
    default:
      throw new Error("Invalid operator");
  }
}

function tokenize(expression) {
  let tokens = [];
  let currentNumber = "";

  for (let char of expression) {
    if ("0123456789.".includes(char)) {
      currentNumber += char;
    } else {
      if (currentNumber !== "") {
        tokens.push(parseFloat(currentNumber));
        currentNumber = "";
      }
      if (char !== " ") {
        tokens.push(char);
      }
    }
  }

  if (currentNumber !== "") {
    tokens.push(parseFloat(currentNumber));
  }

  return tokens;
}

function shuntingYard(tokens) {
  const output = [];
  const operators = [];

  for (let token of tokens) {
    if (typeof token === "number") {
      output.push(token);
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== "("
      ) {
        output.push(operators.pop());
      }
      if (operators.length > 0) {
        operators.pop();
      } else {
        throw new Error("Mismatched parentheses");
      }
    } else if (isOperator(token)) {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== "(" &&
        getPrecedence(operators[operators.length - 1]) >=
          getPrecedence(token)
      ) {
        output.push(operators.pop());
      }
      operators.push(token);
    }
  }

  while (operators.length > 0) {
    const op = operators.pop();
    if (op === "(") throw new Error("Mismatched parentheses");
    output.push(op);
  }

  return output;
}

function evaluateRPN(tokens) {
  const stack = [];

  for (let token of tokens) {
    if (typeof token === "number") {
      stack.push(token);
    } else if (isOperator(token)) {
      if (stack.length < 2) throw new Error("Invalid expression");
      const result = applyOperator(token, stack.pop(), stack.pop());
      if (!isFinite(result)) throw new Error("Division by zero");
      stack.push(result);
    }
  }

  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}

function calculate() {
  playSound('equals');
  try {
    const tokens = tokenize(expression);
    const rpn = shuntingYard(tokens);
    const result = evaluateRPN(rpn);
    expression = String(result).split("");
    cursorPos = expression.length;
    updateDisplay();
  } catch (error) {
    expression = ["Error"];
    cursorPos = 0;
    updateDisplay();
  }
}

//initial display
updateDisplay();
