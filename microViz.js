'use strict';

function renderMicroViz(env) {
  let microVizEvents;
  if (env.callerEnv) {
    microVizEvents = new MicroVizEvents(globalEnv.programOrSendEvent, globalEnv.sourceLoc);
    microVizEvents.eventGroups = [new LocalEventGroup().add(env.microVizEvents)];
  } else {
    microVizEvents = env.microVizEvents;
  }

  microVizDiv.innerHTML = '';
  //microVizDiv.appendChild(d('model', {}, renderModel(microVizEvents)));
  microVizDiv.appendChild(renderProgram());
  microVizDiv.appendChild(renderMicroViz(microVizEvents));
  fixHeights();

  function renderProgram() {
    return d('program', {}, ...lines.map((line, idx) =>
        d('line', {startLine: idx + 1, endLine: idx + 1},
            d('number', {}, '' + (idx + 1)),
            d('text', {}, line))));
  }

  function renderMicroViz(thing, sourceLoc = thing.sourceLoc, cssClass = '') {
    const attributes =
        {startLine: sourceLoc.startLineNumber, endLine: sourceLoc.endLineNumber, class: cssClass};
    if (thing instanceof Event) {
      return d('event', attributes, thing.toMicroVizString());
    } else if (thing instanceof MicroVizEvents && thing.eventGroups.length > 0) {
      return d('send', attributes, ...thing.eventGroups.map(eg => renderMicroViz(eg, sourceLoc)));
    } else if (thing instanceof MicroVizEvents && thing.eventGroups.length === 0) {
      attributes.empty = true;
      return d('send', attributes,
          d('spacerGroup', {},
              ...range(sourceLoc.startLineNumber, sourceLoc.endLineNumber).map(
                  line => d('spacer', {startLine: line, endLine: line}))));
    } else if (thing instanceof LocalEventGroup) {
      let currLine = sourceLoc.startLineNumber;
      const children = [];
      let lastEventNode = null;
      thing.events.forEach(event => {
        const firstInLine = event.sourceLoc.startLineNumber >= currLine;
        if (lastEventNode && firstInLine) {
          lastEventNode.classList.add('lastInLine');
        }
        while (currLine < event.sourceLoc.startLineNumber) {
          children.push(d('spacer', {startLine: currLine, endLine: currLine}));
          currLine++;
        }
        lastEventNode = renderMicroViz(event, event.sourceLoc, firstInLine ? 'firstInLine' : '');
        children.push(lastEventNode);
        currLine = event.sourceLoc.endLineNumber + 1;
      });
      if (lastEventNode) {
        lastEventNode.classList.add('lastInLine');
      }
      while (currLine <= sourceLoc.endLineNumber) {
        children.push(d('spacer', {startLine: currLine, endLine: currLine}));
        currLine++;
      }
      return d('localEventGroup', {isNewIteration: thing.isNewIteration}, ...children);
    } else if (thing instanceof RemoteEventGroup) {
      attributes.isNewIteration = thing.isNewIteration;
      return d('remoteEventGroup', attributes,
          ...thing.events.map(e => renderMicroViz(e, sourceLoc, 'remote firstInLine lastInLine')));
    } else {
      throw new Error('not sure how to renderMicroViz ' + JSON.stringify(thing));
    }
    return node;
  }

  function fixHeights() {
    const $ = document.querySelector.bind(document);
    const $$ = s => [].slice.call(document.querySelectorAll(s));

    for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
      const bottom = $$('#microVizDiv *[endLine="' + lineNumber + '"]').
          map(element => element.getBoundingClientRect().bottom).
          reduce((x, y) => Math.max(x, y));

      const line = $('#microVizDiv program line[startLine="' + lineNumber + '"]');
      inflate(line, bottom);

      const spacers = $$('#microVizDiv spacer[endLine="' + lineNumber + '"]');
      spacers.forEach(spacer => inflate(spacer, bottom));

      const localEvents = $$('#microVizDiv event[endLine="' + lineNumber + '"]:not(.remote)');
      localEvents.forEach(event => inflate(event, bottom));

      const remoteEventGroups = $$('#microVizDiv remoteEventGroup[endLine="' + lineNumber + '"]');
      remoteEventGroups.forEach(remoteEventGroup => inflate(remoteEventGroup, bottom));
    }
  }

  function inflate(element, bottomY) {
    element.style.paddingBottom = bottomY - element.getBoundingClientRect().bottom;
  }
}
