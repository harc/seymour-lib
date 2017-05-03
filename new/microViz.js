'use strict';

function renderMicroViz(env) {
  console.log('rendering micro viz for', env);
  console.log(env.microVizEvents);

  const programNode = document.createElement('pre');
  programNode.innerText =
      lines.map((line, idx) => lpad('' + (idx + 1), 3) + ': ' + line).join('\n');
  microVizDiv.innerHTML = '';
  microVizDiv.appendChild(programNode);

  const vizNode = render(env.microVizEvents);
  microVizDiv.appendChild(vizNode);

  function render(thing) {
    if (thing instanceof Event) {
      const node = document.createElement('uvEvent');
      node.innerHTML = thing.sourceLoc.name;
      return node;
    } else if (thing instanceof MicroVizEvents) {
      const node = document.createElement('uvMicroVizEvents');
      const label = node.appendChild(document.createElement('uvMicroVizEventsLabel'));
      label.innerHTML = thing.sourceLoc.name;
      thing.eventGroups.forEach(eventGroup => node.appendChild(render(eventGroup)));
      return node;
    } else if (thing instanceof LocalEventGroup) {
      const node = document.createElement('uvLocalEventGroup');
      thing.events.forEach(event => node.appendChild(render(event)));
      return node;
    } else if (thing instanceof RemoteEventGroup) {
      const node = document.createElement('uvRemoteEventGroup');
      thing.events.forEach(event => node.appendChild(render(event)));
      return node;
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
}
