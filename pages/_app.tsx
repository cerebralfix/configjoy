import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react';

export const HEADER_HEIGHT = 40;

export const protoFieldTypes: { [key: number]: string } = {
  /**
   * TYPE_DOUBLE - 0 is reserved for errors.
   * Order is weird for historical reasons.
   */
  1: "double",
  2: "float",
  /**
   * TYPE_INT64 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT64 if
   * negative values are likely.
   */
  3: "int64",
  4: "uint64",
  /**
   * TYPE_INT32 - Not ZigZag encoded.  Negative numbers take 10 bytes.  Use TYPE_SINT32 if
   * negative values are likely.
   */
  5: "int32",
  6: "fixed64",
  7: "fixed32",
  8: "bool",
  9: "string",
  /**
   * TYPE_GROUP - Tag-delimited aggregate.
   * Group type is deprecated and not supported in proto3. However, Proto3
   * implementations should still be able to parse the group wire format and
   * treat group fields as unknown fields.
   */
  10: "group",
  /** TYPE_MESSAGE - Length-delimited aggregate. */
  11: "message",
  /** TYPE_BYTES - New in version 2. */
  12: "bytes",
  13: "uint32",
  14: "enum",
  15: "sfixed32",
  16: "sfixed64",
  /** TYPE_SINT32 - Uses ZigZag encoding. */
  17: "sint32",
  /** TYPE_SINT64 - Uses ZigZag encoding. */
  18: "sint64",
}

export const enum MUTATE_ACTION {
  ADD,
  REMOVE,
  MODIFY,
  MODIFY_REVERSE,
  RENAME_KEY,
  RENAME_KEY_REVERSE,
  DELETE_KEYS,
  DELETE_KEYS_REVERSE
}

export const enum MUTATE_OBJECT_TYPE {
  OBJECT,
  ARRAY
}

type ArrayAdd = {
  objectType: MUTATE_OBJECT_TYPE.ARRAY,
  mutateAction: MUTATE_ACTION.ADD,
  array: any,
  indexes: number[],
  items: any[]
}

type ArrayRemove = {
  objectType: MUTATE_OBJECT_TYPE.ARRAY,
  mutateAction: MUTATE_ACTION.REMOVE,
  array: any,
  indexes: number[],
  items: any[]
}

type ObjectChange = {
  objectType: MUTATE_OBJECT_TYPE.OBJECT,
  mutateAction: MUTATE_ACTION.MODIFY | MUTATE_ACTION.MODIFY_REVERSE,
  object: any,
  keys: any[],
  values: any[],
  newValues: any[]
}

type ObjectRenameKey = {
  objectType: MUTATE_OBJECT_TYPE.OBJECT,
  mutateAction: MUTATE_ACTION.RENAME_KEY | MUTATE_ACTION.RENAME_KEY_REVERSE,
  object: any,
  fromKey: any,
  toKey: any,
}

type ObjectDeleteKey = {
  objectType: MUTATE_OBJECT_TYPE.OBJECT,
  mutateAction: MUTATE_ACTION.DELETE_KEYS | MUTATE_ACTION.DELETE_KEYS_REVERSE,
  object: any,
  keys: any[],
  oldValues: any[]
}

export type Change = ArrayAdd | ArrayRemove | ObjectChange | ObjectRenameKey | ObjectDeleteKey;

const oppositeChange = {
  [MUTATE_ACTION.ADD]: MUTATE_ACTION.REMOVE,
  [MUTATE_ACTION.REMOVE]: MUTATE_ACTION.ADD,
  [MUTATE_ACTION.MODIFY]: MUTATE_ACTION.MODIFY_REVERSE,
  [MUTATE_ACTION.MODIFY_REVERSE]: MUTATE_ACTION.MODIFY,
  [MUTATE_ACTION.RENAME_KEY]: MUTATE_ACTION.RENAME_KEY_REVERSE,
  [MUTATE_ACTION.RENAME_KEY_REVERSE]: MUTATE_ACTION.RENAME_KEY,
  [MUTATE_ACTION.DELETE_KEYS]: MUTATE_ACTION.DELETE_KEYS_REVERSE,
  [MUTATE_ACTION.DELETE_KEYS_REVERSE]: MUTATE_ACTION.DELETE_KEYS,
}

function handleChange(change: Change) {
  switch (change.mutateAction) {
    case MUTATE_ACTION.ADD: {
      for (let i = 0; i < change.indexes.length; i++) {
        change.array.splice(change.indexes[i], 0, change.items[i]);
      }
      break;
    }
    case MUTATE_ACTION.REMOVE: {
      let removed = 0;
      for (const index of change.indexes) {
        change.array.splice(index - removed, 1);
        removed++;
      }
      break;
    }
    case MUTATE_ACTION.MODIFY: {
      for (let i = 0; i < change.keys.length; i++) {
        const key = change.keys[i];
        change.object[key] = change.newValues[i];
      }
      break;
    }
    case MUTATE_ACTION.MODIFY_REVERSE: {
      for (let i = 0; i < change.keys.length; i++) {
        const key = change.keys[i];
        change.object[key] = change.values[i];
      }
      break;
    }
    case MUTATE_ACTION.RENAME_KEY: {
      change.object[change.toKey] = change.object[change.fromKey];
      delete change.object[change.fromKey];
      break;
    }
    case MUTATE_ACTION.RENAME_KEY_REVERSE: {
      change.object[change.fromKey] = change.object[change.toKey];
      delete change.object[change.toKey];
      break;
    }
    case MUTATE_ACTION.DELETE_KEYS: {
      for (let i = 0; i < change.keys.length; i++) {
        delete change.object[change.keys[i]];
      }
      break;
    }
    case MUTATE_ACTION.DELETE_KEYS_REVERSE: {
      for (let i = 0; i < change.keys.length; i++) {
        change.object[change.keys[i]] = change.oldValues[i];
      }
      break;
    }
  }
  for (const listener of globalChangeListeners) {
    listener();
  }
  notifyChangeListeners(change);
}

let changeIndex = -1;
let changes: Change[] = [];
type ChangeListener = ({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: any, key?: any } | { objectType: MUTATE_OBJECT_TYPE.ARRAY, array: any[] }) & { listener: () => void }
let changeListeners: ChangeListener[] = []
export const globalChangeListeners: Set<() => void> = new Set();

function notifyChangeListeners(change: Change) {
  for (const listener of changeListeners) {
    if (listener.objectType === MUTATE_OBJECT_TYPE.OBJECT && change.objectType === MUTATE_OBJECT_TYPE.OBJECT && change.object === listener.object) {
      if (!listener.key) {
        listener.listener();
        return;
      }
      let keys: string[] = [];
      if (change.mutateAction === MUTATE_ACTION.MODIFY || change.mutateAction === MUTATE_ACTION.MODIFY_REVERSE
        || change.mutateAction === MUTATE_ACTION.DELETE_KEYS || change.mutateAction === MUTATE_ACTION.DELETE_KEYS_REVERSE) {
        keys = change.keys;
      } else if (change.mutateAction === MUTATE_ACTION.RENAME_KEY || change.mutateAction === MUTATE_ACTION.RENAME_KEY_REVERSE) {
        keys = [change.fromKey, change.toKey];
      }
      if (keys.includes(listener.key)) {
        listener.listener();
      }
    } else if (listener.objectType === MUTATE_OBJECT_TYPE.ARRAY && change.objectType === MUTATE_OBJECT_TYPE.ARRAY) {
      if (listener.array === change.array) {
        listener.listener();
      }
    }
  }
}

export function undo() {
  if (changeIndex > -1 && changes.length > 0) {
    handleChange({ ...changes[changeIndex], mutateAction: oppositeChange[changes[changeIndex].mutateAction] } as any);
    notifyChangeListeners(changes[changeIndex])
    changeIndex = changeIndex - 1;
  }
}

export function redo() {
  if (changeIndex < changes.length - 1 && changes.length > 0) {
    changeIndex = changeIndex + 1;
    handleChange(changes[changeIndex]);
    notifyChangeListeners(changes[changeIndex])
  }
}

export function handleChangeWithHistory(change: Change) {
  if (changeIndex < changes.length - 1) {
    changes = changes.slice(0, changeIndex + 1);
  }
  changes.push(change);
  changeIndex++;
  handleChange(change)
}

export function addChangeListener(listener: ChangeListener) {
  changeListeners.push(listener);
}

export function removeChangeListener(listener: ChangeListener) {
  const changeIndex = changeListeners.findIndex(cl =>
    (listener.objectType === MUTATE_OBJECT_TYPE.OBJECT && cl.objectType === MUTATE_OBJECT_TYPE.OBJECT && listener.key === cl.key && listener.object === cl.object)
    ||
    (listener.objectType === MUTATE_OBJECT_TYPE.ARRAY && cl.objectType === MUTATE_OBJECT_TYPE.ARRAY && listener.array === cl.array)
  );
  if (changeIndex > -1) {
    changeListeners.splice(changeIndex, 1);
  }
}


function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    function onKeyPress(event: KeyboardEvent) {
      if ((event.ctrlKey || (event.metaKey && !event.shiftKey)) && event.key === 'z') {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey && event.key === 'y') || (event.metaKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, []);

  return <Component {...pageProps} />
}

export default MyApp
