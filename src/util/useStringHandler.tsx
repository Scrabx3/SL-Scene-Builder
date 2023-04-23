// Editing this page requires manual reload:
// https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports

import { useState } from "react";

/**
 * @param exclusives A list of mutually exclusive strings
 * @param sortOn Compare functions to sort the list on
 * @returns A stateful value to manage an array of strings
 */
export function useStringListHandler(initialState: Array<String> | (() => Array<String>), exclusives: Array<String>, sortOn?: (a: String, b: String) => number):
  [Array<String>, (state: Array<String> | ((prevState: Array<String>) => Array<String>)) => void] {
  const [state, setState] = useState(initialState)
  const isFunction = (value: any): value is Function => typeof value === 'function'
  const isString = (value: any): value is String => typeof value === 'string'
  const hasTag = (search: String) => {
    const s = search.toLowerCase();
    return state.find(t => t.toLowerCase() === s);
  }

  /**
   * @param arg if string, adds the values to the state. Otherwise replaces state
   */
  const updateState = (arg: String | Array<String> | ((prevState: Array<String>) => Array<String>)) => {
    let newstate = [...state];
    if (!isString(arg)) {
      setState(isFunction(arg) ? arg(state) : arg as Array<String>);
      return;
    } else {
      let additions: Array<String> = arg.split(',');
      additions.forEach(tag => {
        tag.replace(/\s+/g, '');
        if (!tag || hasTag(tag))
          return;

        if (exclusives.includes(tag)) {
          newstate = newstate.filter(t => !exclusives.includes(t));
        }
        newstate.push(tag);
      });
    }
    newstate.sort(sortOn);
    setState(newstate);
  }

  return [state, updateState];
}
