(function () {
  "use strict";

  const root = document.documentElement;
  const display = document.getElementById("display");
  const expression = document.getElementById("expression");
  const keypad = document.querySelector(".keypad");
  const historyList = document.getElementById("history-list");
  const clearHistoryButton = document.getElementById("clear-history");
  const themeToggle = document.getElementById("theme-toggle");
  const operatorSymbols = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
  const maxInputLength = 16;

  let currentValue = "0";
  let storedValue = null;
  let pendingOperator = null;
  let waitingForOperand = false;
  let justEvaluated = false;
  let errorMessage = "";
  let history = loadHistory();

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(safeStorageGet("calculator-history") || "[]");
      return Array.isArray(saved) ? saved.filter((item) =>
        item && typeof item.calculation === "string" &&
        typeof item.result === "string" && typeof item.time === "number"
      ).slice(0, 30) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    safeStorageSet("calculator-history", JSON.stringify(history));
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return null;
    const rounded = Number(value.toPrecision(12));
    if (Object.is(rounded, -0)) return "0";
    return String(rounded);
  }

  function showError(message) {
    errorMessage = message;
    currentValue = "Error";
    expression.textContent = message;
    waitingForOperand = true;
    render();
  }

  function render() {
    display.textContent = currentValue;
    display.classList.toggle("is-error", Boolean(errorMessage));
    keypad.querySelectorAll("[data-operator]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.operator === pendingOperator && !errorMessage);
    });
  }

  function clearError() {
    if (!errorMessage) return;
    errorMessage = "";
    currentValue = "0";
    expression.textContent = "";
    storedValue = null;
    pendingOperator = null;
    waitingForOperand = false;
    justEvaluated = false;
  }

  function inputDigit(digit) {
    clearError();
    if (justEvaluated && !pendingOperator) {
      currentValue = digit;
      expression.textContent = "";
      justEvaluated = false;
      render();
      return;
    }
    if (waitingForOperand) {
      currentValue = digit;
      waitingForOperand = false;
    } else if (currentValue.replace("-", "").length < maxInputLength) {
      currentValue = currentValue === "0" ? digit : currentValue + digit;
    }
    render();
  }

  function inputDecimal() {
    clearError();
    if (justEvaluated && !pendingOperator) {
      currentValue = "0";
      expression.textContent = "";
      justEvaluated = false;
    }
    if (waitingForOperand) {
      currentValue = "0.";
      waitingForOperand = false;
    } else if (!currentValue.includes(".")) {
      currentValue += ".";
    }
    render();
  }

  function calculate(left, right, operator) {
    switch (operator) {
      case "add": return left + right;
      case "subtract": return left - right;
      case "multiply": return left * right;
      case "divide": return right === 0 ? null : left / right;
      default: return right;
    }
  }

  function chooseOperator(operator) {
    if (errorMessage) return;
    const inputValue = Number(currentValue);
    if (pendingOperator && !waitingForOperand) {
      const result = calculate(storedValue, inputValue, pendingOperator);
      if (result === null) {
        showError("Não é possível dividir por zero");
        return;
      }
      const formatted = formatNumber(result);
      if (formatted === null) {
        showError("Resultado fora do limite");
        return;
      }
      currentValue = formatted;
      storedValue = result;
    } else {
      storedValue = inputValue;
    }
    pendingOperator = operator;
    waitingForOperand = true;
    justEvaluated = false;
    errorMessage = "";
    expression.textContent = `${currentValue} ${operatorSymbols[operator]}`;
    render();
  }

  function calculateEquals() {
    if (errorMessage || !pendingOperator || waitingForOperand) return;
    const left = storedValue;
    const right = Number(currentValue);
    const operator = pendingOperator;
    const symbol = operatorSymbols[operator];
    const result = calculate(left, right, operator);
    if (result === null) {
      showError("Não é possível dividir por zero");
      return;
    }
    const formatted = formatNumber(result);
    if (formatted === null) {
      showError("Resultado fora do limite");
      return;
    }
    const calculation = `${formatNumber(left)} ${symbol} ${formatNumber(right)} =`;
    currentValue = formatted;
    expression.textContent = calculation;
    storedValue = null;
    pendingOperator = null;
    waitingForOperand = true;
    justEvaluated = true;
    errorMessage = "";
    addHistory(calculation, formatted);
    render();
  }

  function applyUnary(action) {
    if (errorMessage) clearError();
    let value = Number(currentValue);
    const before = currentValue;
    if (action === "sqrt") {
      if (value < 0) {
        showError("Não é possível calcular a raiz de um número negativo");
        return;
      }
      value = Math.sqrt(value);
      expression.textContent = `√(${before})`;
    } else if (action === "percent") {
      value /= 100;
      expression.textContent = `${before}%`;
    } else if (action === "sign") {
      value = -value;
      expression.textContent = "";
    }
    const formatted = formatNumber(value);
    if (formatted === null) {
      showError("Resultado fora do limite");
      return;
    }
    currentValue = formatted;
    waitingForOperand = false;
    justEvaluated = false;
    render();
  }

  function clearAll() {
    currentValue = "0";
    storedValue = null;
    pendingOperator = null;
    waitingForOperand = false;
    justEvaluated = false;
    errorMessage = "";
    expression.textContent = "";
    render();
  }

  function deleteLastDigit() {
    if (errorMessage) {
      clearAll();
      return;
    }
    if (waitingForOperand || justEvaluated) {
      currentValue = "0";
      waitingForOperand = false;
      justEvaluated = false;
    } else {
      currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : "0";
      if (currentValue === "-") currentValue = "0";
    }
    render();
  }

  function addHistory(calculation, result) {
    history.unshift({ calculation, result, time: Date.now() });
    history = history.slice(0, 30);
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    historyList.replaceChildren();
    clearHistoryButton.disabled = history.length === 0;
    if (history.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = '<span class="empty-icon" aria-hidden="true">↗</span><p>Seus cálculos aparecerão aqui.</p>';
      historyList.append(empty);
      return;
    }
    history.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = "history-entry";
      button.type = "button";
      button.dataset.historyIndex = String(index);
      button.setAttribute("aria-label", `Usar o resultado ${item.result} de ${item.calculation}`);
      const calculation = document.createElement("span");
      calculation.className = "history-calculation";
      calculation.textContent = item.calculation;
      const result = document.createElement("span");
      result.className = "history-result";
      result.textContent = item.result;
      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = new Date(item.time).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
      button.append(calculation, result, time);
      historyList.append(button);
    });
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-label", `Mudar para tema ${isDark ? "claro" : "escuro"}`);
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#151722" : "#f4f6fb";
    safeStorageSet("calculator-theme", theme);
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
    else if (button.dataset.operator) chooseOperator(button.dataset.operator);
    else {
      switch (button.dataset.action) {
        case "clear": clearAll(); break;
        case "decimal": inputDecimal(); break;
        case "equals": calculateEquals(); break;
        case "sign":
        case "percent":
        case "sqrt": applyUnary(button.dataset.action); break;
      }
    }
  });

  historyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-index]");
    if (!button) return;
    const item = history[Number(button.dataset.historyIndex)];
    if (!item) return;
    currentValue = item.result;
    storedValue = null;
    pendingOperator = null;
    waitingForOperand = false;
    justEvaluated = false;
    errorMessage = "";
    expression.textContent = "";
    render();
  });

  clearHistoryButton.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  themeToggle.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) {
      inputDigit(event.key);
      event.preventDefault();
    } else if (event.key === "." || event.key === ",") {
      inputDecimal();
      event.preventDefault();
    } else if (event.key === "+" || event.key === "-" || event.key === "*" || event.key === "/") {
      const operators = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };
      chooseOperator(operators[event.key]);
      event.preventDefault();
    } else if (event.key === "Enter" || event.key === "=") {
      calculateEquals();
      event.preventDefault();
    } else if (event.key === "Backspace") {
      deleteLastDigit();
      event.preventDefault();
    } else if (event.key === "Escape" || event.key.toLowerCase() === "c") {
      clearAll();
      event.preventDefault();
    } else if (event.key === "%") {
      applyUnary("percent");
      event.preventDefault();
    } else if (event.key.toLowerCase() === "r") {
      applyUnary("sqrt");
      event.preventDefault();
    } else if (event.key === "F9") {
      applyUnary("sign");
      event.preventDefault();
    }
  });

  const savedTheme = safeStorageGet("calculator-theme");
  setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light");
  renderHistory();
  render();
}());
