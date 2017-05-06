'use strict';

class SourceLoc {
  constructor(startPos, endPos, startLineNumber, endLineNumber, name) {
    this.startPos = startPos;
    this.endPos = endPos;
    this.startLineNumber = startLineNumber;
    this.endLineNumber = endLineNumber;
    this.name = name;
  }

  equals(sourceLoc) {
    return this.startPos === sourceLoc.startPos && this.endPos === sourceLoc.endPos;
  }

  contains(sourceLoc) {
    return this.startPos <= sourceLoc.startPos && sourceLoc.endPos <= this.endPos;
  }

  strictlyContains(sourceLoc) {
    return this.contains(sourceLoc) && !this.equals(sourceLoc);
  }
}
