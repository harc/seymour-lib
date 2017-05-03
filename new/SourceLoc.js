'use strict';

class SourceLoc {
  constructor(startPos, endPos, startLineNumber, endLineNumber, name) {
    this.startPos = startPos;
    this.endPos = endPos;
    this.startLineNumber = startLineNumber;
    this.endLineNumber = endLineNumber;
    this.name = name;
  }

  contains(sourceLoc) {
    return this.startPos <= sourceLoc.startPos && sourceLoc.endPos <= this.endPos;
  }

  strictlyContains(sourceLoc) {
    return this.contains(sourceLoc) &&
        (this.startPos !== sourceLoc.startPos || this.endPos !== sourceLoc.endPos);
  }
}