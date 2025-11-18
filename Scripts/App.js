let notes = [];

let selectedNoteId;

const titleInput = document.querySelector('#note-title input');
const editor = document.querySelector('#editor');
const previewContainer = document.querySelector('#note-preview-container');
const newNoteBtn = document.getElementById("new-note");
const saveNoteBtn = document.getElementById("save-note");
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
    UpdateNotePreviewList(notes);
    updateSaveButtonState();
   
}

function UpdateNotePreviewList(list){
  previewContainer.innerHTML = "";
    list.forEach(note => {
        createNotePreview(note);
    });
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
  UpdateNotePreviewList(notes);
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
    UpdateNotePreviewList(notes);
    updateSaveButtonState();
});

//save note button

saveNoteBtn.addEventListener("click", (event) => {
    if (selectedNoteId != null || !isNewNoteDirty)
        return;
    AddNote(titleInput.value, editor.textContent);
    updateSaveButtonState();
});

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
    UpdateNotePreviewList(notes);
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
    UpdateNotePreviewList(notes);
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
    time.textContent = new Date(note.lastEdited).toLocaleTimeString();

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
        UpdateNotePreviewList(notes);
        updateSaveButtonState();
    });

    previewContainer.appendChild(noteEl);
}

loadNotesFromStorage();
updateSaveButtonState();
