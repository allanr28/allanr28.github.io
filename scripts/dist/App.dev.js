"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var STORAGE_KEY = "tasks";
var tasks = [];
var completedFilter = false;
var submitBtn = document.getElementById("submit");
var input = document.getElementById("task-input");
var container = document.getElementById("task-container");
var completedFilterBtn = document.getElementById("complete-filter");
var alphabeticalFilterBtn = document.getElementById("alphabetical-filter");
var saved = localStorage.getItem(STORAGE_KEY);

if (saved) {
  tasks = JSON.parse(saved);
  UpdateTaskList(tasks);
}

submitBtn.addEventListener("click", function () {
  var userInput = input.value;
  if (!userInput) return;
  AddTask(userInput);
});

function AddTask(text) {
  var newTask = {
    id: Date.now(),
    text: text,
    completed: false
  };
  tasks.push(newTask);
  SaveTasks();
  UpdateTaskList(tasks);
}

function UpdateTaskList(list) {
  container.innerHTML = "";
  list.forEach(function (task) {
    if (completedFilter) {
      if (task.completed) CreateTaskElement(task);
    } else {
      CreateTaskElement(task);
    }
  });
}

function CreateTaskElement(task) {
  var taskEl = document.createElement('div');
  taskEl.classList.add('task');
  taskEl.dataset.id = task.id;
  var taskText = document.createElement('p');
  taskText.textContent = task.text;
  taskEl.appendChild(taskText);
  var completeTask = document.createElement('div');
  completeTask.classList.add('complete-task');

  if (task.completed === true) {
    var completeIcon = document.createElement('i');
    completeIcon.classList.add('fa-regular', 'fa-circle-check');
    completeTask.appendChild(completeIcon);
  } else {
    var _completeIcon = document.createElement('i');

    _completeIcon.classList.add('fa-regular', 'fa-circle');

    completeTask.appendChild(_completeIcon);
  }

  taskEl.appendChild(completeTask);
  var deleteTask = document.createElement('div');
  deleteTask.classList.add('delete-task');
  var deleteIcon = document.createElement('i');
  deleteIcon.classList.add('fa-solid', 'fa-trash');
  deleteTask.appendChild(deleteIcon);
  taskEl.appendChild(deleteTask);
  container.appendChild(taskEl);
  input.value = "";
  input.focus();
} // Delete task


container.addEventListener("click", function (event) {
  var deleteBtn = event.target.closest(".delete-task");
  if (!deleteBtn) return;
  var taskEl = deleteBtn.closest(".task");
  if (!taskEl) return;
  var id = Number(taskEl.dataset.id);
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  SaveTasks();
  UpdateTaskList(tasks);
});
container.addEventListener("click", function (event) {
  var completeBtn = event.target.closest(".complete-task");
  if (!completeBtn) return;
  var taskEl = completeBtn.closest(".task");
  if (!taskEl) return;
  var id = Number(taskEl.dataset.id);
  tasks = tasks.map(function (task) {
    return task.id === id ? _objectSpread({}, task, {
      completed: !task.completed
    }) : task;
  });
  SaveTasks();
  UpdateTaskList(tasks);
});
completedFilterBtn.addEventListener("click", function (event) {
  completedFilter = !completedFilter;
  UpdateTaskList(tasks);
});
alphabeticalFilterBtn.addEventListener("click", function (event) {
  var sorted = _toConsumableArray(tasks).sort(function (a, b) {
    return a.text.localeCompare(b.text);
  });

  UpdateTaskList(sorted);
});
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    submitBtn.click();
  }
});

function SaveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}