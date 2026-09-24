const STORAGE_KEY = "my-todo-items";

const form = document.getElementById("add-form");
const input = document.getElementById("new-todo");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const summary = document.getElementById("summary");
const filters = document.getElementById("filters");
const clearDone = document.getElementById("clear-done");

let todos = load();
let filter = "all";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // storage unavailable (e.g. private mode) — keep working in memory
  }
}

function render() {
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  list.innerHTML = "";
  for (const todo of visible) {
    const li = document.createElement("li");
    li.className = todo.done ? "done" : "";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggle(todo.id));

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.title = "ลบ";
    del.textContent = "✕";
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, text, del);
    list.append(li);
  }

  const remaining = todos.filter((t) => !t.done).length;
  summary.textContent = `ทั้งหมด ${todos.length} รายการ · เหลือ ${remaining} รายการ`;
  empty.hidden = visible.length > 0;
  clearDone.hidden = !todos.some((t) => t.done);
}

function add(text) {
  todos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), text, done: false });
  save();
  render();
}

function toggle(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
  save();
  render();
}

function remove(id) {
  todos = todos.filter((t) => t.id !== id);
  save();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  add(text);
  input.value = "";
  input.focus();
});

filters.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-filter]");
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const b of filters.querySelectorAll("button")) b.classList.toggle("active", b === btn);
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
