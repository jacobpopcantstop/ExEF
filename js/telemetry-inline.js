(function () {
  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  if (window.EFI && EFI.Auth && !EFI.Auth.requireRole(['admin', 'reviewer'], 'dashboard.html')) {
    return;
  }

  function render() {
    var out = document.getElementById('error-list');
    var rows = (window.EFI && EFI.Telemetry && EFI.Telemetry.getErrors()) || [];
    clearNode(out);
    if (!rows.length) {
      var emptyCard = document.createElement('div');
      emptyCard.className = 'card';
      var emptyText = document.createElement('p');
      emptyText.style.margin = '0';
      emptyText.textContent = 'No client errors recorded.';
      emptyCard.appendChild(emptyText);
      out.appendChild(emptyCard);
      return;
    }
    var card = document.createElement('div');
    card.className = 'card';
    var heading = document.createElement('h3');
    heading.textContent = 'Recorded Errors (' + rows.length + ')';
    card.appendChild(heading);
    var list = document.createElement('ul');
    list.style.paddingLeft = 'var(--space-lg)';
    rows.slice().reverse().forEach(function (r) {
      var item = document.createElement('li');
      item.style.marginBottom = 'var(--space-sm)';
      var strong = document.createElement('strong');
      strong.textContent = r.type;
      item.appendChild(strong);
      item.appendChild(document.createTextNode(' @ ' + new Date(r.at).toLocaleString()));
      item.appendChild(document.createElement('br'));
      var payload = document.createElement('code');
      payload.textContent = JSON.stringify(r.payload);
      item.appendChild(payload);
      item.appendChild(document.createElement('br'));
      var page = document.createElement('span');
      page.style.fontSize = '0.85rem';
      page.style.color = 'var(--color-text-muted)';
      page.textContent = r.page;
      item.appendChild(page);
      list.appendChild(item);
    });
    card.appendChild(list);
    out.appendChild(card);
  }
  document.getElementById('refresh-errors').addEventListener('click', render);
  document.getElementById('clear-errors').addEventListener('click', function () {
    if (window.EFI && EFI.Telemetry) EFI.Telemetry.clearErrors();
    render();
  });
  render();
})();
