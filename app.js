const STORAGE_KEY = "my-todo-v2";

const $ = (id) => document.getElementById(id);
const jobsEl = $("jobs");
const jobTpl = $("job-tpl");
const appTitle = $("app-title");
const sectionTitle = $("section-title");
const status = $("status");
const addJobBtn = $("add-job-btn");
const addJobInput = $("add-job-input");

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.jobs)) return saved;
  } catch {}
  return {
    title: "My Todo",
    section: "งานของฉัน",
    jobs: [
      {
        id: uid(),
        name: "ตัวอย่างจ๊อบ",
        collapsed: false,
        tasks: [
          { id: uid(), text: "กดช่องสี่เหลี่ยมเพื่อติ๊กว่าเสร็จ", done: true },
          { id: uid(), text: "กด ✕ เพื่อลบรายการ", done: false },
        ],
      },
    ],
  };
}

function save() {
  status.classList.add("saving");
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  setTimeout(() => status.classList.remove("saving"), 250);
}

function commit() {
  save();
  render();
}

const findJob = (id) => state.jobs.find((j) => j.id === id);

function render() {
  appTitle.textContent = state.title;
  sectionTitle.textContent = state.section;
  document.title = `${state.title} — Todo List`;

  let total = 0;
  let done = 0;
  jobsEl.innerHTML = "";

  for (const job of state.jobs) {
    const jobDone = job.tasks.filter((t) => t.done).length;
    total += job.tasks.length;
    done += jobDone;

    const el = jobTpl.content.firstElementChild.cloneNode(true);
    el.dataset.id = job.id;
    el.classList.toggle("collapsed", job.collapsed);
    el.querySelector(".job-name").textContent = job.name;
    el.querySelector(".job-count").textContent = `${jobDone}/${job.tasks.length}`;
    el.querySelector(".job-bar .fill").style.width = pct(jobDone, job.tasks.length) + "%";

    const ul = el.querySelector(".tasks");
    for (const task of job.tasks) {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " done" : "");
      li.dataset.id = task.id;
      li.innerHTML = `
        <button class="check" type="button" aria-label="ติ๊กว่าเสร็จ"></button>
        <span class="task-text"></span>
        <button class="remove" type="button" aria-label="ลบรายการ">✕</button>`;
      li.querySelector(".task-text").textContent = task.text;
      ul.append(li);
    }
    jobsEl.append(el);
  }

  $("overall-count").textContent = `${done}/${total} (${pct(done, total)}%)`;
  $("overall-fill").style.width = pct(done, total) + "%";
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// Clicks inside jobs: toggle collapse, remove job, check task, remove task
jobsEl.addEventListener("click", (e) => {
  const jobEl = e.target.closest(".job");
  if (!jobEl) return;
  const job = findJob(jobEl.dataset.id);
  const taskEl = e.target.closest(".task");

  if (taskEl) {
    const idx = job.tasks.findIndex((t) => t.id === taskEl.dataset.id);
    if (e.target.closest(".check") || e.target.closest(".task-text")) {
      job.tasks[idx].done = !job.tasks[idx].done;
      commit();
    } else if (e.target.closest(".remove")) {
      job.tasks.splice(idx, 1);
      commit();
    }
    return;
  }

  if (e.target.closest(".toggle")) {
    job.collapsed = !job.collapsed;
    commit();
  } else if (e.target.closest(".job-head .remove")) {
    if (job.tasks.length === 0 || confirm(`ลบจ๊อบ "${job.name}" และรายการทั้งหมดในจ๊อบนี้?`)) {
      state.jobs = state.jobs.filter((j) => j !== job);
      commit();
    }
  }
});

// Add task to a job
jobsEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target.closest(".add-task");
  const input = form.querySelector("input");
  const text = input.value.trim();
  if (!text) return;
  const jobId = form.closest(".job").dataset.id;
  findJob(jobId).tasks.push({ id: uid(), text, done: false });
  commit();
  jobsEl.querySelector(`.job[data-id="${jobId}"] .add-task input`).focus();
});

// Rename job (inline edit)
jobsEl.addEventListener("focusout", (e) => {
  if (!e.target.classList.contains("job-name")) return;
  const job = findJob(e.target.closest(".job").dataset.id);
  const name = e.target.textContent.trim();
  if (name && name !== job.name) {
    job.name = name;
    save();
  }
  e.target.textContent = job.name;
});

// Enter finishes editing any contenteditable
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.isContentEditable) {
    e.preventDefault();
    e.target.blur();
  }
});

function bindEditable(el, key) {
  el.addEventListener("blur", () => {
    const value = el.textContent.trim();
    if (value && value !== state[key]) {
      state[key] = value;
      save();
    }
    render();
  });
}
bindEditable(appTitle, "title");
bindEditable(sectionTitle, "section");

// Add job
addJobBtn.addEventListener("click", () => {
  addJobBtn.hidden = true;
  addJobInput.hidden = false;
  addJobInput.focus();
});
function closeAddJob() {
  addJobInput.value = "";
  addJobInput.hidden = true;
  addJobBtn.hidden = false;
}
addJobInput.addEventListener("blur", closeAddJob);
addJobInput.addEventListener("keydown", (e) => e.key === "Escape" && addJobInput.blur());
$("add-job").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = addJobInput.value.trim();
  if (!name) return;
  state.jobs.push({ id: uid(), name, collapsed: false, tasks: [] });
  commit();
  closeAddJob();
  jobsEl.lastElementChild.querySelector(".add-task input").focus();
});

render();
