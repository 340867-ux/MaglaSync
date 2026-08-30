(() => {
  'use strict';

  const button = document.getElementById('maglasync-copy-context');
  const textarea = document.getElementById('maglasync-context-value');
  const status = document.getElementById('maglasync-copy-status');

  if (!button || !textarea || !status) {
    return;
  }

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      status.textContent = 'Copied';
    } catch (error) {
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      status.textContent = 'Copied';
    }
  });
})();
