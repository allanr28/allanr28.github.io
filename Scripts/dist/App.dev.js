"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var notes = [];
var selectedNoteId;
var DAY_IN_MS = 24 * 60 * 60 * 1000;
var titleInput = document.querySelector('#note-title input');
var editor = document.querySelector('#editor');
var previewContainer = document.querySelector('#note-preview-container');
var searchInput = document.querySelector('#note-search');
var newNoteBtn = document.getElementById("new-note");
var saveNoteBtn = document.getElementById("save-note");
var deleteNoteBtn = document.getElementById("delete-note");
var isNewNoteDirty = false;

function AddNote(title, text) {
  var newNote = {
    id: crypto.randomUUID(),
    title: title,
    body: text,
    lastEdited: Date.now()
  };
  notes.push(newNote);
  selectedNoteId = newNote.id;
  isNewNoteDirty = false;
  saveNotesToStorage();

  if (searchInput && searchInput.value.trim()) {
    searchInput.value = "";
  }

  renderNotes();
  updateSaveButtonState();
}

function UpdateNotePreviewList(list) {
  previewContainer.innerHTML = "";

  if (!list || list.length === 0) {
    var emptyState = document.createElement("div");
    emptyState.classList.add("no-notes");
    emptyState.textContent = "No matching notes";
    previewContainer.appendChild(emptyState);
    return;
  }

  var sorted = _toConsumableArray(list).sort(function (a, b) {
    return b.lastEdited - a.lastEdited;
  });

  var grouped = groupNotesByCategory(sorted);
  var categoryOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];
  var renderedAny = false;
  categoryOrder.forEach(function (category) {
    var notesInCategory = grouped[category];
    if (!notesInCategory || notesInCategory.length === 0) return;
    var header = document.createElement("div");
    header.classList.add("note-category");
    header.textContent = category;
    previewContainer.appendChild(header);
    notesInCategory.forEach(function (note) {
      return createNotePreview(note);
    });
    renderedAny = true;
  });

  if (!renderedAny) {
    var _emptyState = document.createElement("div");

    _emptyState.classList.add("no-notes");

    _emptyState.textContent = "No matching notes";
    previewContainer.appendChild(_emptyState);
  }
}

function groupNotesByCategory(notesList) {
  return notesList.reduce(function (groups, note) {
    var category = getNoteCategory(note.lastEdited);

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(note);
    return groups;
  }, {});
}

function getNoteCategory(timestamp) {
  var noteDate = new Date(timestamp);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var normalizedNoteDate = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
  var diffDays = Math.floor((today - normalizedNoteDate) / DAY_IN_MS);
  if (diffDays < 0) diffDays = 0;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  if (diffDays < 30) return "This Month";
  return "Older";
}

function getFilteredNotes() {
  if (!searchInput) return notes;
  var query = searchInput.value.trim().toLowerCase();
  if (!query) return notes;
  return notes.filter(function (note) {
    var title = (note.title || "").toLowerCase();
    var body = (note.body || "").toLowerCase();
    return title.includes(query) || body.includes(query);
  });
}

function renderNotes() {
  var filtered = getFilteredNotes();

  if (selectedNoteId && !filtered.some(function (n) {
    return n.id === selectedNoteId;
  })) {
    selectedNoteId = null;
    isNewNoteDirty = false;
    titleInput.value = "";
    editor.textContent = "";
    updateSaveButtonState();
  }

  UpdateNotePreviewList(filtered);
}

function loadNoteIntoEditor() {
  var selectedNote = notes.find(function (note) {
    return note.id === selectedNoteId;
  });
  if (!selectedNote) return;
  titleInput.value = selectedNote.title;
  editor.textContent = selectedNote.body;
}

function updateSaveButtonState() {
  var canSave = selectedNoteId === null && isNewNoteDirty;
  saveNoteBtn.classList.toggle("disabled", !canSave);

  if (!canSave) {
    saveNoteBtn.setAttribute("aria-disabled", "true");
  } else {
    saveNoteBtn.removeAttribute("aria-disabled");
  }

  updateDeleteButtonState();
}

function updateDeleteButtonState() {
  if (!deleteNoteBtn) return;
  var canDelete = selectedNoteId !== null;
  deleteNoteBtn.classList.toggle("disabled", !canDelete);

  if (!canDelete) {
    deleteNoteBtn.setAttribute("aria-disabled", "true");
  } else {
    deleteNoteBtn.removeAttribute("aria-disabled");
  }
}

function saveNotesToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function loadNotesFromStorage() {
  var rawNotes = localStorage.getItem("notes");
  if (!rawNotes) return;

  try {
    notes = JSON.parse(rawNotes);
  } catch (error) {
    notes = [];
    return;
  }

  if (notes.length === 0) return;
  selectedNoteId = notes[0].id;
  renderNotes();
  loadNoteIntoEditor();
  updateSaveButtonState();
} //new note button


newNoteBtn.addEventListener("click", function (event) {
  selectedNoteId = null;
  isNewNoteDirty = false;
  titleInput.value = "";
  editor.textContent = "";
  titleInput.focus();
  renderNotes();
  updateSaveButtonState();
}); //save note button

saveNoteBtn.addEventListener("click", function (event) {
  if (selectedNoteId != null || !isNewNoteDirty) return;
  AddNote(titleInput.value, editor.textContent);
  updateSaveButtonState();
}); //delete note button

if (deleteNoteBtn) {
  deleteNoteBtn.addEventListener("click", function () {
    if (!selectedNoteId) return;
    deleteSelectedNote();
  });
} //update not preview title


titleInput.addEventListener("input", function () {
  var note = notes.find(function (n) {
    return n.id === selectedNoteId;
  });

  if (!note) {
    isNewNoteDirty = true;
    updateSaveButtonState();
    return;
  }

  note.title = titleInput.value;
  note.lastEdited = Date.now();
  saveNotesToStorage();
  renderNotes();
  updateSaveButtonState();
}); //update note preview body and date. 

editor.addEventListener("input", function () {
  var note = notes.find(function (n) {
    return n.id === selectedNoteId;
  });

  if (!note) {
    isNewNoteDirty = true;
    updateSaveButtonState();
    return;
  }

  note.body = editor.textContent;
  note.lastEdited = Date.now();
  saveNotesToStorage();
  renderNotes();
  updateSaveButtonState();
});

function createNotePreview(note) {
  var noteEl = document.createElement("div");
  noteEl.classList.add("note-preview");

  if (note.id === selectedNoteId) {
    noteEl.classList.add("selected");
  }

  var title = document.createElement("div");
  title.classList.add("title");
  title.textContent = note.title;
  var span = document.createElement("span");
  var time = document.createElement("div");
  time.classList.add("time");
  time.textContent = new Date(note.lastEdited).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  var text = document.createElement("div");
  text.classList.add("text");
  text.textContent = note.body;
  span.appendChild(time);
  span.appendChild(text);
  noteEl.appendChild(title);
  noteEl.appendChild(span);
  noteEl.addEventListener("click", function () {
    selectedNoteId = note.id;
    isNewNoteDirty = false;
    loadNoteIntoEditor();
    renderNotes();
    updateSaveButtonState();
  });
  previewContainer.appendChild(noteEl);
}

function deleteSelectedNote() {
  var noteIndex = notes.findIndex(function (n) {
    return n.id === selectedNoteId;
  });
  if (noteIndex === -1) return;
  notes.splice(noteIndex, 1);
  saveNotesToStorage();

  if (notes.length === 0) {
    selectedNoteId = null;
    titleInput.value = "";
    editor.textContent = "";
  } else {
    var nextIndex = Math.min(noteIndex, notes.length - 1);
    selectedNoteId = notes[nextIndex].id;
    loadNoteIntoEditor();
  }

  isNewNoteDirty = false;
  renderNotes();
  updateSaveButtonState();
}

loadNotesFromStorage();
updateSaveButtonState();

if (searchInput) {
  searchInput.addEventListener("input", renderNotes);
}