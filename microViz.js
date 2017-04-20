function renderMicroViz(env) {
  microVizDiv.innerHTML = '';
  const view = microVizDiv.appendChild(document.createElement('table'));

  lines.forEach((line, idx) => {
    const row = view.appendChild(document.createElement('tr'));

    const lineNumberCell = row.appendChild(document.createElement('td'));
    lineNumberCell.appendChild(document.createTextNode(idx + 1));

    const lineCell = row.appendChild(document.createElement('td'));
    lineCell.appendChild(document.createTextNode(line));
  });

  let currLine = 1;
  let currCol = 2;
  let numColsInLine = [];
  for (let idx = 0; idx < lines.length; idx++) {
    numColsInLine.push(2);
  }

  function add(sourceLoc, event) {
    if (sourceLoc.startLineNumber < currLine) {
      currCol++;
    }
    currLine = sourceLoc.startLineNumber;
    for (let ln = sourceLoc.startLineNumber; ln <= sourceLoc.endLineNumber; ln++) {
      currCol = Math.max(currCol, numColsInLine[ln - 1] + 1);
    }
    const tr = view.children[sourceLoc.startLineNumber - 1];
    const numSpacersNeeded = currCol - numColsInLine[sourceLoc.startLineNumber - 1] - 1;
    for (let idx = 0; idx < numSpacersNeeded; idx++) {
      tr.appendChild(document.createElement('td'));
    }
    for (let ln = sourceLoc.startLineNumber; ln <= sourceLoc.endLineNumber; ln++) {
       numColsInLine[ln - 1] = currCol;
    }
    const td = tr.appendChild(document.createElement('td'));
    const height = sourceLoc.endLineNumber - sourceLoc.startLineNumber + 1;
    td.setAttribute('rowspan', height);
    let text;
    if (event instanceof EventGroup) {
      td.classList.add('eventGroup');
      text = event.events.map(e => '(' + eventToString(e) + ')').join('\n');
    } else {
      text = eventToString(event);
    }
    td.appendChild(document.createTextNode(text));
  }

  function eventToString(event) {
    if (event instanceof VarDeclEvent ||
        event instanceof VarAssignmentEvent) {
      return event.name + ' = ' + valueToString(event.value);
    } else if (event instanceof InstVarAssignmentEvent) {
      return valueToString(event.obj) + '.' + event.name + ' = ' + valueToString(event.value);
    } else if (event instanceof ReturnEvent) {
      return 'return ' + valueToString(event.value);
    } else {
      return event.constructor.name;
    }
  }

  function valueToString(value) {
    if (value === undefined) {
      return 'undefined';
    } else if (typeof value === 'function') {
      return '{function}';
    } else {
      return JSON.stringify(value);
    }
  }

  env.microVizEvents.forEach(event => add(event.sourceLoc, event));
}
