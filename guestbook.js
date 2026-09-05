const config = () => window.GUESTBOOK_CONFIG || { apiUrl: '' };
const form = document.querySelector('[data-guestbook-form]');
const statusLine = document.querySelector('[data-guestbook-status]');
const notice = document.querySelector('[data-setup-notice]');
const nicknameInput = document.querySelector('#nickname');
const messageInput = document.querySelector('#message');
const messageCount = document.querySelector('#message-count');
const submitButton = form.querySelector('button[type="submit"]');
const publicMessages = document.querySelector('[data-public-messages]');

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('is-error', isError);
}

function ready() {
  return Boolean(config().apiUrl) && config().apiUrl !== '__CLOUDBASE_GATEWAY_URL__';
}

function endpoint(path) {
  return `${config().apiUrl.replace(/\/$/, '')}${path}`;
}

function renderPublicMessages(messages) {
  publicMessages.replaceChildren();
  if (!messages.length) {
    const empty = document.createElement('p');
    empty.className = 'message-empty';
    empty.textContent = '还没有公开留言，第一句留给你。';
    publicMessages.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  messages.forEach((message, index) => {
    const note = document.createElement('article');
    const number = document.createElement('span');
    const body = document.createElement('p');
    const nickname = document.createElement('strong');
    number.textContent = String(index + 1).padStart(2, '0');
    body.textContent = message.body;
    nickname.textContent = `— ${message.nickname}`;
    note.append(number, body, nickname);
    fragment.append(note);
  });
  publicMessages.append(fragment);
}

async function loadPublicMessages() {
  if (!ready()) return;
  try {
    const response = await fetch(endpoint('/api/messages?limit=24'));
    const payload = await response.json();
    if (!response.ok) throw new Error();
    renderPublicMessages(payload.messages || []);
  } catch {
    publicMessages.replaceChildren();
  }
}

async function submitMessage(event) {
  event.preventDefault();
  if (!ready()) return setStatus('留言服务尚未完成设置。', true);
  const nickname = nicknameInput.value.trim();
  const body = messageInput.value.trim();
  if (!nickname || nickname.length > 16) return setStatus('昵称需为 1 到 16 个字。', true);
  if (!body || body.length > 160) return setStatus('留言需为 1 到 160 个字。', true);
  submitButton.disabled = true;
  setStatus('正在送达…');
  try {
    const response = await fetch(endpoint('/api/messages'), {
      method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ nickname, body }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || '暂时无法提交，请稍后再试。');
    form.reset();
    messageCount.textContent = '0';
    setStatus('留言已送达，等待审核。');
  } catch (error) {
    setStatus(error.message || '暂时无法提交，请稍后再试。', true);
  } finally {
    submitButton.disabled = false;
  }
}

messageInput.addEventListener('input', () => { messageCount.textContent = String(messageInput.value.length); });
form.addEventListener('submit', submitMessage);
if (!ready()) notice.hidden = false;
else loadPublicMessages();

window.Guestbook = { submitMessage, loadPublicMessages };
