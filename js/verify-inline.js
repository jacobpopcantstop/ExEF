(function(){
  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function appendTextParagraph(container, text, color) {
    var p = document.createElement('p');
    if (color) p.style.color = color;
    p.textContent = text;
    container.appendChild(p);
    return p;
  }

  function appendLabeledValue(container, label, value) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = label;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(' ' + value));
    container.appendChild(p);
  }

  function renderResult(out, title, paragraphs) {
    clearNode(out);
    var heading = document.createElement('h3');
    heading.textContent = title;
    out.appendChild(heading);
    (paragraphs || []).forEach(function (entry) {
      if (!entry) return;
      if (entry.type === 'labeled') {
        appendLabeledValue(out, entry.label, entry.value);
        return;
      }
      appendTextParagraph(out, entry.text, entry.color);
    });
  }

  document.getElementById('verify-form').addEventListener('submit', function(e){
    e.preventDefault();
    var id = document.getElementById('verify-id').value.trim().toUpperCase();
    var receipt = document.getElementById('verify-receipt').value.trim() || new URLSearchParams(window.location.search).get('receipt') || '';
    var out = document.getElementById('verify-result');
    out.style.display = 'block';
    if (!receipt) {
      renderResult(out, 'Verification Requires Receipt', [
        { text: 'This verification flow requires a signed receipt token from certificate issuance.' }
      ]);
      return;
    }

    if (receipt.indexOf('demo-preview') === 0) {
      renderResult(out, 'Demo Preview', [
        { type: 'labeled', label: 'Credential ID:', value: id || 'Demo preview record' },
        { type: 'labeled', label: 'Status:', value: 'Preview only. This is not a live EFI server-signed verification record.' },
        { text: 'The demo account lets you review the verification screen flow without exposing a real public credential token.', color: 'var(--color-text-muted)' }
      ]);
      return;
    }

    var query = '/api/verify?receipt=' + encodeURIComponent(receipt) + '&product=certificate';
    if (id) query += '&credential_id=' + encodeURIComponent(id);

    fetch(query)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok || !data.verified) {
          renderResult(out, 'Not Verified', [
            { text: 'The signed token did not produce a valid certificate match.' },
            { text: 'If you entered a credential ID, it may not match the receipt token you provided.', color: 'var(--color-text-muted)' }
          ]);
          return;
        }
        renderResult(out, 'Verified', [
          { type: 'labeled', label: 'Credential ID:', value: data.receipt.credential_id || '' },
          { type: 'labeled', label: 'Issued:', value: new Date(data.receipt.issued_at).toLocaleDateString() },
          { type: 'labeled', label: 'Status:', value: 'Verified via EFI server-signed purchase record.' }
        ]);
      }).catch(function () {
        renderResult(out, 'Verification Error', [
          { text: 'Could not contact the verification service.' }
        ]);
      });
  });
  var preset = new URLSearchParams(window.location.search).get('id');
  if (preset) document.getElementById('verify-id').value = preset;
  var presetReceipt = new URLSearchParams(window.location.search).get('receipt');
  if (presetReceipt) document.getElementById('verify-receipt').value = presetReceipt;
})();
