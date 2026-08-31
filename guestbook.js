const config = () => window.GUESTBOOK_CONFIG || { workerUrl: '' };
const form = document.querySelector('[data-guestbook-form]');
const statusLine = document.querySelector('[data-guestbook-status]');
const notice = document.querySelector('[data-setup-notice]');
const nicknameInput = document.querySelector('#nickname');
const messageInput = document.querySelector('#message');
const messageCount = document.querySelector('#message-count');
const submitButton = form.querySelector('button[type="submit"]');

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('is-error', isError);
}

function ready() {
  return Boolean(config().workerUrl);
}

function endpoint(path) {
  return `${config().workerUrl.replace(/\/$/, '')}${path}`;
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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nickname, body }),
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

window.Guestbook = { submitMessage };
