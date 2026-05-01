function escapeClosingScriptTag(sourceCode) {
  return sourceCode.replace(/<\/script>/g, '<\\/script>');
}

export function buildCodePreviewConsoleScript(sourceCode) {
  const safeSourceCode = escapeClosingScriptTag(sourceCode);

  return `
const outputElement = document.getElementById('out');

function appendConsoleLine(prefix, color, ...args) {
  const line = document.createElement('div');
  line.className = 'console-line';
  line.innerHTML =
    '<span class="prefix" style="color:' +
    color +
    '">' +
    prefix +
    '</span>' +
    args.map((arg) => stringifyConsoleArg(arg)).join(' ');
  outputElement.appendChild(line);
}

const console = {
  log: (...args) => appendConsoleLine('->', '#4ecdc4', ...args),
  error: (...args) => appendConsoleLine('x', '#ff6b6b', ...args),
  warn: (...args) => appendConsoleLine('!', '#ffa726', ...args),
  table: (value) => appendConsoleLine('[]', '#4ecdc4', value),
  group: () => {},
  groupEnd: () => {},
  time: () => {},
  timeEnd: (label) => appendConsoleLine('t', '#8888a8', label + ': ~1ms'),
};

function stringifyConsoleArg(value) {
  try {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  } catch {
    return String(value);
  }
}

try {
  ${safeSourceCode}
} catch (error) {
  console.error(error.message);
}
`;
}
