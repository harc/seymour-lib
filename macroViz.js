function renderMacroViz(globalEnv) {
  const children = globalEnv.children.map(eventToMacroVizNode);
  const macroViz = mkMacroVizNode('user', children, () => renderMicroViz(globalEnv));
  macroVizDiv.innerHTML = '';
  macroVizDiv.appendChild(macroViz);
}

function eventToMacroVizNode(event) {
  return mkMacroVizNode(
      event.sourceLoc.name,
      event instanceof SendEvent ? event.activationEnv.children.map(eventToMacroVizNode) : [],
      event instanceof SendEvent ? (() => renderMicroViz(event.activationEnv)) : null);
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
