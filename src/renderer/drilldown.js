// drilldown.js — recursive spatial exploration.
//
// Selecting a panel spawns its `children` as a new, nearer arc and pushes a
// breadcrumb. Going back re-lays the previous level. Browsing becomes a walk
// through the shape of the topic rather than a scroll of links.

import { expandChildren } from '../content/bitcoinCorpus.js';

export class DrillStack {
  /**
   * @param {import('./spatialLayout.js').SpatialLayout} layout
   * @param {(crumbs:{id:string,title:string}[])=>void} onCrumbs  HUD callback
   */
  constructor(layout, onCrumbs) {
    this.layout = layout;
    this.onCrumbs = onCrumbs;
    this.stack = []; // [{ title, results }]
  }

  /** Set the root level (from a fresh search). */
  setRoot(title, results) {
    this.stack = [{ id: 'root', title, results }];
    this.layout.layout(results);
    this._emit();
  }

  /** Drill into a node: spawn its children as the next level. */
  enter(node) {
    const kids = expandChildren(node.children || []);
    if (!kids.length) return false; // leaf — nothing to expand
    this.stack.push({ id: node.id, title: node.title, results: kids });
    this.layout.layout(kids);
    this._emit();
    return true;
  }

  /** Pop back up one level. */
  back() {
    if (this.stack.length <= 1) return false;
    this.stack.pop();
    const top = this.stack[this.stack.length - 1];
    this.layout.layout(top.results);
    this._emit();
    return true;
  }

  depth() { return this.stack.length; }

  _emit() {
    this.onCrumbs?.(this.stack.map((s) => ({ id: s.id, title: s.title })));
  }
}
