function renderMacroViz(globalEnv) {
  const macroViz = eventToMacroVizNode(globalEnv.programOrSendEvent);
  macroVizDiv.innerHTML = '';
  macroVizDiv.appendChild(macroViz);
}

function eventToMacroVizNode(event) {
  const eventIsProgramOrSend = event instanceof ProgramEvent || event instanceof SendEvent;
  return mkMacroVizNode(
      event.sourceLoc.name,
      event.children,
      event.activationEnv ? (() => renderMicroViz(event.activationEnv)) : null);
}

function mkMacroVizNode(labelText, childNodes, onClickFn) {
  const label = d('label', {}, labelText);
  label.onclick = onClickFn;
  return d('macroVizNode', {}, label, d('children', {}, ...childNodes.map(eventToMacroVizNode)));
}
