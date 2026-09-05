const adminConfig = () => window.GUESTBOOK_CONFIG || { apiUrl: '' };
const loginForm = document.querySelector('[data-admin-login]');
const passwordInput = document.querySelector('#admin-password');
const lock = document.querySelector('[data-admin-lock]');
const desk = document.querySelector('[data-admin-desk]');
const status = document.querySelector('[data-admin-status]');
const list = document.querySelector('[data-pending-list]');
const empty = document.querySelector('[data-empty-pending]');
const sessionKey = 'guestbook-admin-password';

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function endpoint(path) {
  return `${adminConfig().apiUrl.replace(/\/$/, '')}${path}`;
}

function password() { return sessionStorage.getItem(sessionKey) || ''; }

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function requestOptions(options = {}) {
  return { ...options, headers: { 'x-guestbook-admin': password(), ...(options.headers || {}) } };
}

function renderMessages(messages) {
  list.replaceChildren();
  messages.forEach((message) => {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.messageId = message.id;
    const body = document.createElement('p');
    body.textContent = message.body;
    const meta = document.createElement('div');
    meta.className = 'review-meta';
    const name = document.createElement('span');
    name.textContent = message.nickname;
    const date = document.createElement('time');
    date.dateTime = message.created_at;
    date.textContent = formatDate(message.created_at);
    const state = document.createElement('span');
    state.className = `message-status is-${message.status}`;
    state.dataset.messageStatus = '';
    state.textContent = { pending: '待审核', approved: '已公开', deleted: '已删除' }[message.status] || '未知状态';
    meta.append(name, date, state);
    const actions = document.createElement('div');
    actions.className = 'review-actions';
    const availableActions = message.status === 'pending' ? [['approve', '公开'], ['delete', '删除']] : message.status === 'approved' ? [['delete', '删除']] : [];
    availableActions.forEach(([action, label]) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      button.addEventListener('click', () => reviewMessage(message.id, action, button));
      actions.append(button);
    });
    card.append(body, meta, actions);
    list.append(card);
  });
  empty.hidden = messages.length > 0;
}

async function loadAllMessages() {
  const response = await fetch(endpoint('/api/admin/messages'), requestOptions({ cache: 'no-store' }));
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || '暂时无法读取留言。');
  renderMessages(payload.messages || []);
}

async function openReviewDesk(event) {
  event.preventDefault();
  if (!adminConfig().apiUrl || adminConfig().apiUrl === '__CLOUDBASE_GATEWAY_URL__') return setStatus('请先完成留言服务设置。', true);
  const value = passwordInput.value;
  if (!value) return setStatus('请输入管理口令。', true);
  sessionStorage.setItem(sessionKey, value);
  setStatus('正在进入审核台…');
  try {
    await loadAllMessages();
    lock.hidden = true;
    desk.hidden = false;
  } catch (error) {
    sessionStorage.removeItem(sessionKey);
    setStatus(error.message || '暂时无法进入审核台。', true);
  }
}

async function reviewMessage(id, action, clickedButton) {
  const card = list.querySelector(`[data-message-id="${id}"]`);
  const buttons = card?.querySelectorAll('button') || [];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const response = await fetch(endpoint('/api/admin/messages'), requestOptions({
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action }), cache: 'no-store',
    }));
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || '操作未完成。');
    await loadAllMessages();
  } catch (error) {
    buttons.forEach((button) => { button.disabled = false; });
    clickedButton?.focus();
    alert(error.message || '操作未完成。');
  }
}

function signOut() {
  sessionStorage.removeItem(sessionKey);
  list.replaceChildren();
  desk.hidden = true;
  lock.hidden = false;
  passwordInput.value = '';
  setStatus('已结束管理。');
}

loginForm.addEventListener('submit', openReviewDesk);
document.querySelector('[data-admin-signout]').addEventListener('click', signOut);
window.GuestbookAdmin = { openReviewDesk, reviewMessage, loadAllMessages, signOut };
