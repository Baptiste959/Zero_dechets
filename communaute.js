// communaute.js
// ✅ Communauté "from scratch" : pseudo + feed avant/après + missions + classement + chat (LocalStorage)

const KEYS = {
  username: "zdr_username_v1",
  posts: "zdr_feed_posts_v1",
  stats: "zdr_user_stats_v1", // { [username]: { posts: n, missions: n } }
  chat: "zdr_chat_messages_v1",
};

// ---------- Helpers ----------
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function pointsOf(stat) {
  const missions = stat?.missions ?? 0;
  const posts = stat?.posts ?? 0;
  return missions * 10 + posts * 5;
}

async function fileToBase64(file) {
  if (!file) return "";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- DOM ----------
const meBadge = document.getElementById("meBadge");
const btnLogin = document.getElementById("btnLogin");

const postText = document.getElementById("postText");
const beforeImgInput = document.getElementById("beforeImg");
const afterImgInput = document.getElementById("afterImg");
const btnPublish = document.getElementById("btnPublish");
const feedList = document.getElementById("feedList");

const btnAddMission = document.getElementById("btnAddMission");
const leaderboardList = document.getElementById("leaderboardList");

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const btnClearChat = document.getElementById("btnClearChat");

// ---------- User (pseudo) ----------
function getUsername() {
  const saved = (localStorage.getItem(KEYS.username) || "").trim();
  if (saved) return saved;

  const fresh = (prompt("Choisis ton pseudo (ex: Maël)") || "").trim();
  const name = fresh || "Anonyme";
  localStorage.setItem(KEYS.username, name);
  return name;
}

function setUsernameFlow() {
  const current = getUsername();
  const next = (prompt("Nouveau pseudo :", current) || "").trim();
  if (!next) return;
  localStorage.setItem(KEYS.username, next);
  refreshAll();
}

function ensureStatUser(username) {
  const stats = readJSON(KEYS.stats, {});
  if (!stats[username]) stats[username] = { posts: 0, missions: 0 };
  writeJSON(KEYS.stats, stats);
}

function addPostCount(username) {
  const stats = readJSON(KEYS.stats, {});
  ensureStatUser(username);
  stats[username].posts = (stats[username].posts ?? 0) + 1;
  writeJSON(KEYS.stats, stats);
}

function addMissionCount(username) {
  const stats = readJSON(KEYS.stats, {});
  ensureStatUser(username);
  stats[username].missions = (stats[username].missions ?? 0) + 1;
  writeJSON(KEYS.stats, stats);
}

function renderMe() {
  const username = getUsername();
  ensureStatUser(username);

  const stats = readJSON(KEYS.stats, {});
  const me = stats[username] || { posts: 0, missions: 0 };

  meBadge.innerHTML = `
    <div class="me-title">Connecté : <b>${escapeHtml(username)}</b></div>
    <div class="me-sub">
      Missions : <b>${me.missions ?? 0}</b> • Posts : <b>${me.posts ?? 0}</b><br/>
      Points : <b>${pointsOf(me)}</b>
    </div>
  `;
}

// ---------- Feed ----------
function loadPosts() {
  return readJSON(KEYS.posts, []);
}

function savePosts(posts) {
  writeJSON(KEYS.posts, posts);
}

function renderFeed() {
  const posts = loadPosts().slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (!posts.length) {
    feedList.innerHTML = `<div class="card" style="opacity:.8">Aucun post pour l’instant. Lance le feed 👇</div>`;
    return;
  }

  feedList.innerHTML = posts
    .map((p) => {
      const before = p.beforeImg ? `
        <div class="post-imgbox">
          <div class="imglabel">AVANT</div>
          <img src="${p.beforeImg}" alt="Photo avant">
        </div>` : "";

      const after = p.afterImg ? `
        <div class="post-imgbox">
          <div class="imglabel">APRÈS</div>
          <img src="${p.afterImg}" alt="Photo après">
        </div>` : "";

      const images = (before || after) ? `
        <div class="post-images">
          ${before || `<div class="post-imgbox" style="display:flex;align-items:center;justify-content:center;opacity:.6">Pas de photo AVANT</div>`}
          ${after || `<div class="post-imgbox" style="display:flex;align-items:center;justify-content:center;opacity:.6">Pas de photo APRÈS</div>`}
        </div>` : "";

      return `
        <article class="card post" data-postid="${escapeHtml(p.id)}">
          <div class="post-head">
            <div>
              <div class="post-author">${escapeHtml(p.username)}</div>
              <div class="post-time">${formatDate(p.createdAt)}</div>
            </div>
            <div class="post-actions">
              <button class="btn-outline btn-small like-btn" type="button">
                👍 ${p.likes ?? 0}
              </button>
            </div>
          </div>

          ${p.text ? `<div class="post-text">${escapeHtml(p.text)}</div>` : ""}

          ${images}
        </article>
      `;
    })
    .join("");
}

btnPublish.addEventListener("click", async () => {
  const username = getUsername();
  ensureStatUser(username);

  const text = (postText.value || "").trim();
  const beforeFile = beforeImgInput.files?.[0] || null;
  const afterFile = afterImgInput.files?.[0] || null;

  if (!text && !beforeFile && !afterFile) {
    alert("Ajoute du texte ou au moins une photo 🙂");
    return;
  }

  const beforeImg = await fileToBase64(beforeFile);
  const afterImg = await fileToBase64(afterFile);

  const posts = loadPosts();
  posts.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    username,
    text,
    beforeImg,
    afterImg,
    likes: 0,
    createdAt: new Date().toISOString(),
  });

  savePosts(posts);
  addPostCount(username);

  // reset
  postText.value = "";
  beforeImgInput.value = "";
  afterImgInput.value = "";

  refreshAll();
});

feedList.addEventListener("click", (e) => {
  const btn = e.target.closest(".like-btn");
  if (!btn) return;

  const postEl = e.target.closest("[data-postid]");
  if (!postEl) return;
  const postId = postEl.getAttribute("data-postid");

  const posts = loadPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return;

  posts[idx].likes = (posts[idx].likes ?? 0) + 1;
  savePosts(posts);
  refreshAll();
});

// ---------- Missions -> +10 points (déclaration) ----------
btnAddMission.addEventListener("click", () => {
  const username = getUsername();
  ensureStatUser(username);

  const ok = confirm("Tu confirmes avoir participé / réalisé une mission ?");
  if (!ok) return;

  addMissionCount(username);
  refreshAll();
});

// ---------- Leaderboard ----------
function renderLeaderboard() {
  const stats = readJSON(KEYS.stats, {});
  const rows = Object.entries(stats)
    .map(([username, stat]) => ({
      username,
      missions: stat?.missions ?? 0,
      posts: stat?.posts ?? 0,
      points: pointsOf(stat),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  if (!rows.length) {
    leaderboardList.innerHTML = `<div style="opacity:.75">Aucun classement pour l’instant.</div>`;
    return;
  }

  const medal = ["🥇", "🥈", "🥉", "4", "5"];

  leaderboardList.innerHTML = rows
    .map(
      (u, i) => `
        <div class="lb-row">
          <div class="lb-rank">${medal[i]}</div>
          <div class="lb-name">${escapeHtml(u.username)}</div>
          <div class="lb-kpi">
            <b>${u.points} pts</b>
            <small>${u.missions} missions • ${u.posts} posts</small>
          </div>
        </div>
      `
    )
    .join("");
}

// ---------- Chat global ----------
function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function loadChat() {
  return readJSON(KEYS.chat, []);
}

function saveChat(msgs) {
  writeJSON(KEYS.chat, msgs);
}

function renderChat() {
  const msgs = loadChat();
  chatMessages.innerHTML = "";

  if (!msgs.length) {
    const empty = document.createElement("div");
    empty.className = "chat-empty";
    empty.textContent = "Aucun message pour l’instant. Lance la conversation 👇";
    chatMessages.appendChild(empty);
    return;
  }

  for (const m of msgs) {
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `
      <div class="chat-meta">
        <span class="chat-name">${escapeHtml(m.name || "Anonyme")}</span>
        <span class="chat-time">${escapeHtml(m.time || "--:--")}</span>
      </div>
      <div class="chat-text">${escapeHtml(m.text || "")}</div>
    `;
    chatMessages.appendChild(div);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = (chatInput.value || "").trim();
  if (!text) return;

  const name = getUsername();
  const msgs = loadChat();
  msgs.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    time: nowTime(),
    text,
  });

  // limite
  const trimmed = msgs.length > 200 ? msgs.slice(msgs.length - 200) : msgs;
  saveChat(trimmed);

  chatInput.value = "";
  chatInput.focus();
  renderChat();
});

btnClearChat.addEventListener("click", () => {
  const ok = confirm("Effacer tous les messages du chat (sur cet ordinateur) ?");
  if (!ok) return;
  saveChat([]);
  renderChat();
});

// sync entre onglets
window.addEventListener("storage", (e) => {
  if (e.key === KEYS.posts || e.key === KEYS.stats || e.key === KEYS.chat || e.key === KEYS.username) {
    refreshAll();
  }
});

// ---------- Boot ----------
btnLogin.addEventListener("click", setUsernameFlow);

function refreshAll() {
  renderMe();
  renderLeaderboard();
  renderFeed();
  renderChat();
}

refreshAll();
