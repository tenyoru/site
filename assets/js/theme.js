// theme.js
document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const checkbox = document.querySelector('#theme-switch input[type="checkbox"]');

  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    if (checkbox) checkbox.checked = theme === 'dark';
  };

  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');         // 'dark' | 'light' | null
    if (stored === 'dark' || stored === 'light') return stored;
    if (mq?.matches) return 'dark';                       // система тёмная
    return 'dark';                                        // дефолт — тёмная
  };

  // init
  applyTheme(getInitialTheme());

  // ручное переключение
  checkbox?.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    // console.log('[theme] switched to', theme);
  }, false);

  // если пользователь меняет системную тему и НЕТ локального выбора — подстраиваемся
  mq?.addEventListener?.('change', (e) => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return;  // уважаем ручной выбор
    applyTheme(e.matches ? 'dark' : 'light');
  });
});
