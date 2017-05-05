'use strict';

function renderMicroViz(env) {
  console.log('rendering micro viz for', env);
  console.log(env.microVizEvents);

  microVizDiv.innerHTML = '';
  microVizDiv.appendChild(renderProgram());
  microVizDiv.appendChild(renderMicroViz(env.callerEnv ?
      (() => {
        const mves = new MicroVizEvents(globalEnv.programOrSendEvent, globalEnv.sourceLoc);
        mves.eventGroups = [new LocalEventGroup().add(env.microVizEvents)];
        return mves;
      })() :
      env.microVizEvents));

  const elements = [].slice.call(document.querySelectorAll('microViz *[startLine][endLine]'));
  for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
    const top = elements.
        filter(element => element.getAttribute('startLine') == lineNumber).
        map(element => element.getBoundingClientRect().top).
        reduce((x, y) => Math.min(x, y));
    const bottom = elements.
        filter(element => element.getAttribute('endLine') == lineNumber).
        map(element => element.getBoundingClientRect().bottom).
        reduce((x, y) => Math.max(x, y));
    const height = bottom - top;
    const line = document.querySelector('microViz program line[startLine="' + lineNumber + '"]');
    const marginBottom = height - line.clientHeight;
    line.style.marginBottom = marginBottom;
    console.log('line', lineNumber, 'needs an extra', marginBottom);
    const spacers = [].slice.call(document.querySelectorAll(
      'microViz spacer[startLine="' + lineNumber + '"][endLine="' + lineNumber + '"]'));
    spacers.forEach(spacer => {
      spacer.style.marginBottom = height - spacer.clientHeight;
    });
    const events = [].slice.call(document.querySelectorAll(
      'microViz event[endLine="' + lineNumber + '"]:not(.remote)'));
    events.forEach(event => {
      event.style.marginBottom = bottom - event.getBoundingClientRect().bottom;
    });
  }

  function renderProgram() {
    return d('program', {}, ...lines.map((line, idx) =>
        d('line', {startLine: idx + 1, endLine: idx + 1},
            d('number', {}, '' + (idx + 1)),
            d('text', {}, line))));
  }

  function renderMicroViz(thing, sourceLoc = thing.sourceLoc, cssClass = '') {
    const attributes =
        {startLine: sourceLoc.startLineNumber, endLine: sourceLoc.endLineNumber, class: cssClass};
    let node;
    if (thing instanceof Event) {
      node = d('event', attributes, thing.toMicroVizString());
    } else if (thing instanceof MicroVizEvents) {
      node = d('send', attributes,
          d('spacerGroup', {}, ...range(sourceLoc.startLineNumber, sourceLoc.endLineNumber).map(line =>
              d('spacer', {startLine: line, endLine: line}))),
          ...thing.eventGroups.map(eg => renderMicroViz(eg, sourceLoc)));
    } else if (thing instanceof LocalEventGroup) {
      let currLine = sourceLoc.startLineNumber;
      const children = [];
      thing.events.forEach(event => {
        const firstInLine = event.sourceLoc.startLineNumber >= currLine;
        while (currLine < event.sourceLoc.startLineNumber) {
          children.push(d('spacer', {startLine: currLine, endLine: currLine}));
          currLine++;
        }
        children.push(renderMicroViz(event, event.sourceLoc, firstInLine ? 'newline' : ''));
        currLine = event.sourceLoc.endLineNumber + 1;
      });
      node = d('localEventGroup', {}, ...children);
    } else if (thing instanceof RemoteEventGroup) {
      node = d('remoteEventGroup', {}, ...thing.events.map(e => renderMicroViz(e, sourceLoc, 'remote newline')));
    } else {
      throw new Error('not sure how to render ' + JSON.stringify(thing));
    }
    node._thing = thing;
    return node;
  }

  function renderModel(thing) {
    if (thing instanceof Event) {
      return d('uvEvent', {}, thing.sourceLoc.name);
    } else if (thing instanceof MicroVizEvents) {
      return d('uvMicroVizEvents', {},
          d('uvMicroVizEventsLabel', {}, thing.sourceLoc.name),
          ...thing.eventGroups.map(e => render(e)));
    } else if (thing instanceof LocalEventGroup) {
      return d('uvLocalEventGroup', {}, ...thing.events.map(e => render(e)));
    } else if (thing instanceof RemoteEventGroup) {
      return d('uvRemoteEventGroup', {}, ...thing.events.map(e => render(e)));
    } else {
      throw new Error('not sure how to render ' + JSON.stringify(thing));
    }
  }

  function lpad(s, n) {
    while (s.length < n) {
      s = ' ' + s;
    }
    return s;
  }

  function range(from, to) {
    const ans = [];
    for (let x = from; x <= to; x++) {
      ans.push(x);
    }
    return ans;
  }

  function d(elementType, attributes, ...children) {
    const node = document.createElement(elementType);
    Object.keys(attributes).forEach(name => node.setAttribute(name, attributes[name]));
    for (let child of children) {
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }
}
