import { strict as assert } from "node:assert";
import {
  createFindState,
  findNextMatch,
  findPreviousMatch,
  getMatchSummary,
  getScrollTarget,
} from "../src/modules/ui/findState";

const text = "alpha beta alpha\nGamma alpha\nALPHA";
const state = createFindState(text, "alpha");

assert.equal(state.matches.length, 4);
assert.equal(getMatchSummary(state), "4 matches");
assert.equal(findNextMatch(state, 0).index, 1);
assert.equal(findPreviousMatch(state, 3).index, 2);
assert.equal(
  getScrollTarget("line one\nline two\nline three", 18, {
    lineHeight: 20,
    viewportHeight: 60,
  }),
  20,
);

console.log("find tests passed");
