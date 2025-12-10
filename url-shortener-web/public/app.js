(async function(){
  const form = document.getElementById('shortenForm');
  const result = document.getElementById('result');
  const shortLinkEl = document.getElementById('shortLink');
  const qrImg = document.getElementById('qrImg');
  const downloadQr = document.getElementById('downloadQr');
  const copyBtn = document.getElementById('copyBtn');
  const listBody = document.querySelector('#list tbody');
  const refreshBtn = document.getElementById('refresh');
  const searchInput = document.getElementById('search');

  async function showList(q=''){
    listBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    const res = await fetch('/api/list?limit=100&q=' + q);
    const data = await res.json();
    if(!data.length){
      listBody.innerHTML = '<tr><td colspan="6">No links yet</td></tr>';
      return;
    }
    listBody.innerHTML = data.map(r => `
      <tr>
        <td>${r.code}</td>
        <td><a href="${r.short}" target="_blank">${r.short}</a></td>
        <td title="${r.url}">${r.url.slice(0,50)}...</td>
        <td>${r.created_at}</td>
        <td>${r.expires_at ?? '-'}</td>
        <td><button class="qrBtn" data-code="${r.code}">QR</button></td>
      </tr>
    `).join('');

    document.querySelectorAll('.qrBtn').forEach(btn => {
      btn.onclick = async () => {
        const code = btn.dataset.code;
        qrImg.src = `/api/qr/${code}`;
        downloadQr.href = `/api/qr/${code}`;
        downloadQr.download = `${code}.png`;
        result.classList.remove('hidden');
      };
    });
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value;
    const alias = document.getElementById('alias').value;
    const expire = document.getElementById('expire').value;

    const payload = { url };
    if(alias) payload.alias = alias;
    if(expire > 0) payload.expire_days = Number(expire);

    const res = await fetch('/api/shorten',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });

    const data = await res.json();
    shortLinkEl.href = data.short;
    shortLinkEl.textContent = data.short;
    qrImg.src = data.qr;
    downloadQr.href = data.qr;
    downloadQr.download = `${data.code}.png`;
    result.classList.remove('hidden');
    showList();
  };

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(shortLinkEl.href);
    alert('Copied!');
  };

  refreshBtn.onclick = () => showList(searchInput.value);

  showList();
})();
