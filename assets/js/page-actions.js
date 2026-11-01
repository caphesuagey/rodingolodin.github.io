(() => {
  const button = document.getElementById('page-actions-button');
  const toggle = document.getElementById('page-actions-toggle');
  const menu = document.getElementById('page-actions-menu');
  const status = document.getElementById('page-actions-status');
  const buttonText = button?.querySelector('.button-text');
  if (!button || !toggle || !menu || !status || !buttonText) return;

  const container = button.closest('.page-actions');
  const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
  const markdown = () => document.getElementById('raw-content')?.textContent ?? '';
  let selectedAction = 'copy-page';
  let feedbackTimer;

  const actions = {
    'copy-page': {
      label: 'Copy for LLM',
      async run() {
        try {
          await navigator.clipboard.writeText(markdown());
          clearTimeout(feedbackTimer);
          buttonText.textContent = 'Copied';
          status.textContent = 'Page copied as Markdown.';
          feedbackTimer = setTimeout(() => {
            buttonText.textContent = actions[selectedAction].label;
          }, 2000);
        } catch (error) {
          status.textContent = 'Could not copy. Try View as Markdown instead.';
          console.error('Failed to copy:', error);
        }
      }
    },
    'view-markdown': {
      label: 'View as Markdown',
      run() {
        const preview = window.open('', '_blank');
        if (!preview) {
          status.textContent = 'Allow pop-ups to view this page as Markdown.';
          return;
        }
        preview.opener = null;
        preview.document.title = 'Markdown Content';
        const pre = preview.document.createElement('pre');
        pre.textContent = markdown();
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.overflowWrap = 'anywhere';
        preview.document.body.append(pre);
      }
    }
  };

  const closeMenu = (restoreFocus = false) => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  };

  const openMenu = (index = 0) => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    items[index].focus();
  };

  toggle.addEventListener('click', () => {
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  toggle.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowUp' ? items.length - 1 : 0);
    }
  });

  button.addEventListener('click', () => {
    status.textContent = '';
    actions[selectedAction].run();
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (!actions[action]) return;
      clearTimeout(feedbackTimer);
      selectedAction = action;
      buttonText.textContent = actions[action].label;
      items.forEach((entry) => entry.classList.toggle('is-selected', entry === item));
      status.textContent = '';
      closeMenu(true);
      actions[action].run();
    });
  });

  menu.addEventListener('keydown', (event) => {
    const index = items.indexOf(document.activeElement);
    let next;
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break;
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break;
      case 'Home': next = 0; break;
      case 'End': next = items.length - 1; break;
      default: return;
    }
    event.preventDefault();
    items[next].focus();
  });

  container.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      closeMenu(true);
    }
  });

  container.addEventListener('focusout', (event) => {
    if (!container.contains(event.relatedTarget)) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!container.contains(event.target)) closeMenu();
  });
})();
