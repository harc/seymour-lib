'use strict';

let sls;
let lines;

function prog(p) {
  sls = {};
  lines = [''];
  let pos = 0;
  process(p);

  function process(p) {
    if (p instanceof Array) {
      p.forEach(process);
    } else if (typeof p === 'string') {
      pos += p.length;
      p.split('\n').forEach((l, idx) => {
        if (idx === 0) {
          lines[lines.length - 1] += l;
        } else {
          lines.push(l);
        }
      });
    } else {
      const startPos = pos;
      const startLineNumber = lines.length;
      process(p.code);
      const endPos = pos;
      const endLineNumber = lines.length;
      sls[p.name] = new SourceLoc(startPos, endPos, startLineNumber, endLineNumber, p.name);
    }
  }
}
