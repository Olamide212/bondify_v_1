// store/voiceIntroStore.js
// Simple module-level store to pass callbacks across Expo Router screens
// without serializing functions into params.

let _onSave = null;
let _onDelete = null;

export const voiceIntroStore = {
  setSave:   (fn) => { _onSave   = fn; },
  setDelete: (fn) => { _onDelete = fn; },
  save:      (...args) => _onSave?.(...args),
  delete:    (...args) => _onDelete?.(...args),
  clear:     () => { _onSave = null; _onDelete = null; },
};