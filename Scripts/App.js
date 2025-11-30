let notes = [];

let selectedNoteId;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const titleInput = document.querySelector('#note-title input');
const editor = document.querySelector('#editor');
const toolbar = document.getElementById("editor-toolbar");
const previewContainer = document.querySelector('#note-preview-container');
const searchInput = document.querySelector('#note-search');
const newNoteBtn = document.getElementById("new-note");
const saveNoteBtn = document.getElementById("save-note");
const deleteNoteBtn = document.getElementById("delete-note");
const closeEditorBtn = document.getElementById("close-editor");
let isNewNoteDirty = false;
const mobileLayoutQuery = window.matchMedia("(max-width: 600px)");
let isMobileLayout = mobileLayoutQuery.matches;

function generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // Set RFC4122 variant/version bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return Array.from(bytes, b => b.toString(16).padStart(2, "0"))
            .join("")
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.+)$/, "$1-$2-$3-$4-$5");
    }
    // Last-resort fallback
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function syncMobileLayoutState() {
    document.body.classList.toggle("mobile-layout", isMobileLayout);
    if (!isMobileLayout) {
        document.body.classList.remove("mobile-editor-open");
    }
}

function handleMobileLayoutChange(event) {
    isMobileLayout = event.matches;
    syncMobileLayoutState();
}

function openMobileEditor() {
    if (!isMobileLayout) return;
    document.body.classList.add("mobile-editor-open");
}

function closeMobileEditor() {
    if (!isMobileLayout) return;
    document.body.classList.remove("mobile-editor-open");
}

syncMobileLayoutState();
if (typeof mobileLayoutQuery.addEventListener === "function") {
    mobileLayoutQuery.addEventListener("change", handleMobileLayoutChange);
} else if (typeof mobileLayoutQuery.addListener === "function") {
    mobileLayoutQuery.addListener(handleMobileLayoutChange);
}

function getPlainTextFromHTML(html = "") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
}

function AddNote(title, html){
    const newNote = {
        id: generateId(),  
        title: title,
        body: html || "",
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
    closeMobileEditor();
   
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
    const body = getPlainTextFromHTML(note.body).toLowerCase();
    return title.includes(query) || body.includes(query);
  });
}

function renderNotes() {
  const filtered = getFilteredNotes();
  if (selectedNoteId && !filtered.some(n => n.id === selectedNoteId)) {
    selectedNoteId = null;
    isNewNoteDirty = false;
    titleInput.value = "";
    editor.innerHTML = "";
    updateSaveButtonState();
  }
  UpdateNotePreviewList(filtered);
}

function loadNoteIntoEditor() {
  const selectedNote = notes.find(note => note.id === selectedNoteId);
  if (!selectedNote) return; 

  titleInput.value = selectedNote.title || "";     
  editor.innerHTML = selectedNote.body || "";    
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
        const parsed = JSON.parse(rawNotes);
        if (!Array.isArray(parsed)) {
            throw new Error("Invalid notes shape");
        }
        notes = parsed;
    } catch (error) {
        localStorage.removeItem("notes");
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
    editor.innerHTML = "";
    openMobileEditor();
    titleInput.focus();
    renderNotes();
    updateSaveButtonState();
});

//save note button

saveNoteBtn.addEventListener("click", (event) => {
    if (selectedNoteId != null || !isNewNoteDirty)
        return;
    AddNote(titleInput.value, editor.innerHTML);
    updateSaveButtonState();
});

//delete note button
if (deleteNoteBtn) {
  deleteNoteBtn.addEventListener("click", () => {
    if (!selectedNoteId) return;
    deleteSelectedNote();
  });
}

if (closeEditorBtn) {
  closeEditorBtn.addEventListener("click", () => {
    closeMobileEditor();
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

    note.body = editor.innerHTML;
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

    const plainText = getPlainTextFromHTML(note.body);
    const firstLine = (plainText.split(/\r?\n/).find(line => line.trim() !== "") || plainText || "").trim();
    const text = document.createElement("div");
    text.classList.add("text");
    text.textContent = firstLine;

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
        openMobileEditor();
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
    editor.innerHTML = "";
    closeMobileEditor();
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

if (toolbar) {
  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const command = button.dataset.command;
    if (!command) return;

    let value = button.dataset.value || null;
    if (command === "formatBlock" && value && !value.startsWith("<")) {
      value = `<${value}>`;
    }
    editor.focus();
    if (typeof document.execCommand === "function") {
      try {
        document.execCommand(command, false, value);
      } catch (err) {
        console.warn("Formatting command failed", err);
      }
    } else {
      console.warn("Formatting not supported in this browser.");
    }
  });
}
