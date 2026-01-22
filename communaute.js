// communaute.js
// ✅ Chat "global" simulé sur un seul ordi (LocalStorage)

const STORAGE_KEY = "zdr_chat_messages_v1";
const NAME_KEY = "zdr_chat_name_v1";

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const btnChangeName = document.getElementById("btnChangeName");
const btnClear = document.getElementById("btnClear");

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function getName() {
  const saved = localStorage.getItem(NAME_KEY);
  if (saved && saved.trim()) return saved.trim();

  const fresh = prompt("Choisis un pseudo (ex: Maël)") || "Anonyme";
  localStorage.setItem(NAME_KEY, fresh.trim() || "Anonyme");
  return localStorage.getItem(NAME_KEY);
}

let username = getName();
let messages = loadMessages();

function render() {
  chatMessages.innerHTML = "";

  if (messages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-empty";
    empty.textContent = "Aucun message pour l’instant. Lance la conversation 👇";
    chatMessages.appendChild(empty);
    return;
  }

  for (const msg of messages) {
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `
      <div class="chat-meta">
        <span class="chat-name">${escapeHtml(msg.name || "Anonyme")}</span>
        <span class="chat-time">${escapeHtml(msg.time || "--:--")}</span>
      </div>
      <div class="chat-text">${escapeHtml(msg.text || "")}</div>
    `;
    chatMessages.appendChild(div);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text) {
  const msg = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: username,
    time: nowTime(),
    text,
  };

  messages.push(msg);

  // garde max 200 messages pour éviter que ça gonfle
  if (messages.length > 200) messages = messages.slice(messages.length - 200);

  saveMessages(messages);
  render();
}

// Sync si tu ouvres 2 onglets sur le même PC
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    messages = loadMessages();
    render();
  }
});

btnChangeName.addEventListener("click", () => {
  const next = prompt("Nouveau pseudo :", username);
  if (!next) return;
  username = next.trim() || "Anonyme";
  localStorage.setItem(NAME_KEY, username);
});

btnClear.addEventListener("click", () => {
  const ok = confirm("Effacer tous les messages sur cet ordinateur ?");
  if (!ok) return;
  messages = [];
  saveMessages(messages);
  render();
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  chatInput.focus();
  addMessage(text);
});

// Premier rendu
render();
