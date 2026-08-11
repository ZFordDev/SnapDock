import { strict as assert } from 'node:assert';
import { createFindState, findNextMatch, findPreviousMatch, getMatchSummary, getScrollTarget } from '../src/modules/ui/find.js';

const text = 'alpha beta alpha\nGamma alpha\nALPHA';

const state = createFindState(text, 'alpha');
assert.equal(state.matches.length, 4);
assert.equal(getMatchSummary(state), '4 matches');

const next = findNextMatch(state, 0);
assert.equal(next.index, 1);

const prev = findPreviousMatch(state, 3);
assert.equal(prev.index, 2);

const scrollTarget = getScrollTarget('line one\nline two\nline three', 18, { lineHeight: 20, viewportHeight: 60 });
assert.equal(scrollTarget, 20);

console.log('find tests passed');
