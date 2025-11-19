const BASE_URL = "https://tiny-link-6k6m.onrender.com";

async function fetchLinks() {
  return (await fetch(BASE_URL + '/api/links')).json();
}

function render(rows) {
  const tbody = document.querySelector('#linksTable tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><a href="/code/' + r.code + '">' + r.code + '</a></td>' +
      '<td class="url"><a href="' + r.target_url + '" target="_blank">' + r.target_url + '</a></td>' +
      '<td>' + r.clicks + '</td>' +
      '<td>' + (r.last_clicked ? new Date(r.last_clicked).toLocaleString() : '—') + '</td>' +
      '<td><button class=copy data-code=' + r.code + '>Copy</button>' +
      '<button class=open data-code=' + r.code + '>Open</button>' +
      '<button class=del data-code=' + r.code + ' style="background:#c33">Delete</button></td>';
    tbody.appendChild(tr);
  });
}

async function refresh() {
  let rows = await fetchLinks();
  const f = document.getElementById('filter').value.toLowerCase();
  if (f) rows = rows.filter(r => r.code.toLowerCase().includes(f) || r.target_url.toLowerCase().includes(f));
  render(rows);
}

document.getElementById('createForm').addEventListener('submit', async e => {
  e.preventDefault();
  const url = document.getElementById('target_url').value.trim();
  const code = document.getElementById('code').value.trim();
  const msg = document.getElementById('msg');

  const res = await fetch(BASE_URL + '/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_url: url, code: code || undefined })
  });

  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.error;
    msg.style.color = 'red';
    return;
  }

  msg.textContent = 'Created!';
  msg.style.color = 'green';

  document.getElementById('target_url').value = '';
  document.getElementById('code').value = '';

  refresh();
});

document.getElementById('filter').addEventListener('input', refresh);

document.querySelector('#linksTable tbody').addEventListener('click', async e => {
  if (!e.target.dataset.code) return;
  const code = e.target.dataset.code;

  if (e.target.classList.contains('copy')) {
    navigator.clipboard.writeText(BASE_URL + '/' + code);
    e.target.textContent = 'Copied!';
    setTimeout(() => e.target.textContent = 'Copy', 900);
  }

  else if (e.target.classList.contains('open')) {
    window.open(BASE_URL + '/' + code, '_blank');
  }

  else if (e.target.classList.contains('del')) {
    if (!confirm('Delete ' + code + '?')) return;
    await fetch(BASE_URL + '/api/links/' + code, { method: 'DELETE' });
    refresh();
  }
});

window.onload = refresh;
