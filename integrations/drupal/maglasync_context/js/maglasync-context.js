(function (Drupal) {
  'use strict';

  Drupal.behaviors.maglasyncContext = {
    attach(context) {
      context.querySelectorAll('[data-maglasync-copy="button"]').forEach((button) => {
        if (button.dataset.maglasyncBound === '1') {
          return;
        }
        button.dataset.maglasyncBound = '1';

        button.addEventListener('click', async () => {
          const container = button.closest('.maglasync-context');
          const textarea = container ? container.querySelector('[data-maglasync-context="value"]') : null;
          const status = container ? container.querySelector('[data-maglasync-status]') : null;
          if (!textarea || !status) {
            return;
          }

          try {
            await navigator.clipboard.writeText(textarea.value);
          } catch (error) {
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
          }
          status.textContent = Drupal.t('Copied');
        });
      });
    }
  };
})(Drupal);
