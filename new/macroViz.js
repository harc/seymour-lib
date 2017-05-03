function renderMacroViz(globalEnv) {
  const macroViz = eventToMacroVizNode(globalEnv.programOrSendEvent);
  macroVizDiv.innerHTML = '';
  macroVizDiv.appendChild(macroViz);
}

function eventToMacroVizNode(event) {
  const eventIsProgramOrSend = event instanceof ProgramEvent || event instanceof SendEvent;
  return mkMacroVizNode(
      event.sourceLoc.name,
      event.children.map(eventToMacroVizNode),
      event.activationEnv ? (() => renderMicroViz(event.activationEnv)) : null);
}

function mkMacroVizNode(labelText, childNodes, onClickFn) {
  const node = document.createElement('macroVizNode');
  const label = node.appendChild(document.createElement('label'));
  label.appendChild(document.createTextNode(labelText));
  label.onclick = onClickFn;
  const children = node.appendChild(document.createElement('children'));
  childNodes.forEach(childNode => children.appendChild(childNode));
  return node;
}
