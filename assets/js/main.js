(function () {
  const copy = async (button) => {
    const targetId = button.getAttribute('data-target');
    if (!targetId) {
      return;
    }

    const codeElement = document.getElementById(targetId);
    if (!codeElement) {
      return;
    }

    const text = codeElement.innerText;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }

      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.classList.remove('is-copied');
      }, 1600);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  document.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('.code-copy');
      if (!button) {
        return;
      }

      event.preventDefault();
      copy(button);
    },
    false,
  );
})();
