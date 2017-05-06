function renderModel(thing) {
  if (thing instanceof Event) {
    return d('event', {}, thing.sourceLoc.name);
  } else if (thing instanceof MicroVizEvents) {
    return d('send', {},
        d('label', {}, thing.sourceLoc.name),
        ...thing.eventGroups.map(e => renderModel(e)));
  } else if (thing instanceof LocalEventGroup) {
    return d('localEventGroup', {}, ...thing.events.map(e => renderModel(e)));
  } else if (thing instanceof RemoteEventGroup) {
    return d('remoteEventGroup', {}, ...thing.events.map(e => renderModel(e)));
  } else {
    throw new Error('not sure how to renderModel ' + JSON.stringify(thing));
  }
}
