const STORAGE_KEY = "tasks";

let tasks = [];

let completedFilter = false;

const submitBtn = document.getElementById("submit");
const input = document.getElementById("task-input");
const container = document.getElementById("task-container");

const completedFilterBtn = document.getElementById("complete-filter");
const alphabeticalFilterBtn = document.getElementById("alphabetical-filter");

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    tasks = JSON.parse(saved);
    UpdateTaskList(tasks);
}

submitBtn.addEventListener("click", () => {
    const userInput = input.value;
    if (!userInput) return;

    AddTask(userInput);
    
});

function AddTask(text){

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };

    tasks.push(newTask);
    SaveTasks();
    UpdateTaskList(tasks);
}

function UpdateTaskList(list){
    container.innerHTML = "";
    list.forEach(task => {
        if(completedFilter)
        {
            if(task.completed)
                CreateTaskElement(task);
        }else{
            CreateTaskElement(task);
        } 
    });
}

function CreateTaskElement(task){

    const taskEl = document.createElement('div');
    taskEl.classList.add('task');
    taskEl.dataset.id = task.id;

    const taskText = document.createElement('p');
    taskText.textContent = task.text;
    taskEl.appendChild(taskText);


    const completeTask = document.createElement('div');
    completeTask.classList.add('complete-task');

    if(task.completed === true){
        const completeIcon = document.createElement('i');
        completeIcon.classList.add('fa-regular', 'fa-circle-check');
        completeTask.appendChild(completeIcon);
    }else{
        const completeIcon = document.createElement('i');
        completeIcon.classList.add('fa-regular', 'fa-circle');
        completeTask.appendChild(completeIcon); 
    }

    taskEl.appendChild(completeTask);

    const deleteTask = document.createElement('div');
    deleteTask.classList.add('delete-task');

    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fa-solid', 'fa-trash');
    deleteTask.appendChild(deleteIcon);

    taskEl.appendChild(deleteTask);

    container.appendChild(taskEl);

    input.value = "";
    input.focus();
}

// Delete task
container.addEventListener("click", (event) => {
    const deleteBtn = event.target.closest(".delete-task");
    if (!deleteBtn) return; 

    const taskEl = deleteBtn.closest(".task");
    if (!taskEl) return;

    const id = Number(taskEl.dataset.id);

    tasks = tasks.filter(task => task.id !== id);

    SaveTasks();
    UpdateTaskList(tasks);
});

container.addEventListener("click", (event) => {
    const completeBtn = event.target.closest(".complete-task");
    if (!completeBtn) return; 

    const taskEl = completeBtn.closest(".task"); 
    if (!taskEl) return;

    const id = Number(taskEl.dataset.id); 

    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed } 
            : task
    );

    SaveTasks();
    UpdateTaskList(tasks);
});

completedFilterBtn.addEventListener("click", (event) => {
    completedFilter = !completedFilter;

    UpdateTaskList(tasks);
});

alphabeticalFilterBtn.addEventListener("click", (event) => {
    const sorted = [...tasks].sort((a, b) =>
        a.text.localeCompare(b.text)
    );

    UpdateTaskList(sorted);
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitBtn.click();
    }
});

function SaveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}






