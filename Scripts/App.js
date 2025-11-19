let notes = [];

let selectedNoteId;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const titleInput = document.querySelector('#note-title input');
const editor = document.querySelector('#editor');
const previewContainer = document.querySelector('#note-preview-container');
const searchInput = document.querySelector('#note-search');
const newNoteBtn = document.getElementById("new-note");
const saveNoteBtn = document.getElementById("save-note");
const deleteNoteBtn = document.getElementById("delete-note");
let isNewNoteDirty = false;

function AddNote(title, text){
    const newNote = {
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

function UpdateNotePreviewList(list){
  previewContainer.innerHTML = "";
  if (!list || list.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.classList.add("no-notes");
    emptyState.textContent = "No matching notes";
    previewContainer.appendChild(emptyState);
    return;
  }

  const sorted = [...list].sort((a, b) => b.lastEdited - a.lastEdited);
  const grouped = groupNotesByCategory(sorted);
  const categoryOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];
  let renderedAny = false;

  categoryOrder.forEach(category => {
    const notesInCategory = grouped[category];
    if (!notesInCategory || notesInCategory.length === 0) return;

    const header = document.createElement("div");
    header.classList.add("note-category");
    header.textContent = category;
    previewContainer.appendChild(header);

    notesInCategory.forEach(note => createNotePreview(note));
    renderedAny = true;
  });

  if (!renderedAny) {
    const emptyState = document.createElement("div");
    emptyState.classList.add("no-notes");
    emptyState.textContent = "No matching notes";
    previewContainer.appendChild(emptyState);
  }
}

function groupNotesByCategory(notesList) {
  return notesList.reduce((groups, note) => {
    const category = getNoteCategory(note.lastEdited);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(note);
    return groups;
  }, {});
}

function getNoteCategory(timestamp) {
  const noteDate = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedNoteDate = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

  let diffDays = Math.floor((today - normalizedNoteDate) / DAY_IN_MS);
  if (diffDays < 0) diffDays = 0;

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  if (diffDays < 30) return "This Month";
  return "Older";
}

function getFilteredNotes() {
  if (!searchInput) return notes;
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return notes;

  return notes.filter(note => {
    const title = (note.title || "").toLowerCase();
    const body = (note.body || "").toLowerCase();
    return title.includes(query) || body.includes(query);
  });
}

function renderNotes() {
  const filtered = getFilteredNotes();
  if (selectedNoteId && !filtered.some(n => n.id === selectedNoteId)) {
    selectedNoteId = null;
    isNewNoteDirty = false;
    titleInput.value = "";
    editor.textContent = "";
    updateSaveButtonState();
  }
  UpdateNotePreviewList(filtered);
}

function loadNoteIntoEditor() {
  const selectedNote = notes.find(note => note.id === selectedNoteId);
  if (!selectedNote) return; 

  titleInput.value = selectedNote.title;     
  editor.textContent = selectedNote.body;    
}

function updateSaveButtonState() {
  const canSave = selectedNoteId === null && isNewNoteDirty;
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
  const canDelete = selectedNoteId !== null;
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
  const rawNotes = localStorage.getItem("notes");
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
}

//new note button

newNoteBtn.addEventListener("click", (event) => {
    selectedNoteId = null;
    isNewNoteDirty = false;
    titleInput.value = "";
    editor.textContent = "";
    titleInput.focus();
    renderNotes();
    updateSaveButtonState();
});

//save note button

saveNoteBtn.addEventListener("click", (event) => {
    if (selectedNoteId != null || !isNewNoteDirty)
        return;
    AddNote(titleInput.value, editor.textContent);
    updateSaveButtonState();
});

//delete note button
if (deleteNoteBtn) {
  deleteNoteBtn.addEventListener("click", () => {
    if (!selectedNoteId) return;
    deleteSelectedNote();
  });
}

//update not preview title
titleInput.addEventListener("input", () => {
    const note = notes.find(n => n.id === selectedNoteId);
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
});

//update note preview body and date. 
editor.addEventListener("input", () => {
    const note = notes.find(n => n.id === selectedNoteId);
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
    const noteEl = document.createElement("div");
    noteEl.classList.add("note-preview");
    if (note.id === selectedNoteId) {
      noteEl.classList.add("selected");
    }

    const title = document.createElement("div");
    title.classList.add("title");
    title.textContent = note.title;

    const span = document.createElement("span");

    const time = document.createElement("div");
    time.classList.add("time");
    time.textContent = new Date(note.lastEdited).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const text = document.createElement("div");
    text.classList.add("text");
    text.textContent = note.body;

    span.appendChild(time);
    span.appendChild(text);

    noteEl.appendChild(title);
    noteEl.appendChild(span);

    noteEl.addEventListener("click", () => {
        selectedNoteId = note.id;
        isNewNoteDirty = false;
        loadNoteIntoEditor();
        renderNotes();
        updateSaveButtonState();
    });

    previewContainer.appendChild(noteEl);
}

function deleteSelectedNote() {
  const noteIndex = notes.findIndex(n => n.id === selectedNoteId);
  if (noteIndex === -1) return;

  notes.splice(noteIndex, 1);
  saveNotesToStorage();

  if (notes.length === 0) {
    selectedNoteId = null;
    titleInput.value = "";
    editor.textContent = "";
  } else {
    const nextIndex = Math.min(noteIndex, notes.length - 1);
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
