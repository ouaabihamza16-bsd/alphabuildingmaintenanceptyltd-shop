/* Alpha Building & Maintenance: menu, smooth scroll, enquiry form, legal dialogs */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    var iconOpen = toggle.querySelector('[data-icon="open"]');
    var iconClose = toggle.querySelector('[data-icon="close"]');
    if (iconOpen) iconOpen.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) setMenu(false);
    });
  }

  /* ---------- Smooth scroll for in-page links ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash.length < 2) return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    setMenu(false);
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (history.pushState) history.pushState(null, '', hash);

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Legal dialogs ---------- */
  var lastTrigger = null;

  function openDialog(dialog, trigger) {
    if (!dialog) return;
    lastTrigger = trigger || null;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.documentElement.classList.add('modal-open');
    var body = dialog.querySelector('.legal-body');
    if (body) body.scrollTop = 0;
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
      afterClose();
    }
  }

  function afterClose() {
    document.documentElement.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
    lastTrigger = null;
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openDialog(document.getElementById(btn.getAttribute('data-modal-open')), btn);
    });
  });

  document.querySelectorAll('dialog.legal-dialog').forEach(function (dialog) {
    dialog.addEventListener('close', afterClose);
    dialog.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeDialog(dialog); });
    });
    // Close when clicking the backdrop
    dialog.addEventListener('click', function (e) {
      if (e.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeDialog(dialog);
    });
    // Esc for browsers without native dialog support
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && typeof dialog.showModal !== 'function') closeDialog(dialog);
    });
  });

  /* ---------- Enquiry form (not connected: validates only, sends nothing) ---------- */
  var form = document.getElementById('enquiry-form');
  var statusBox = document.getElementById('form-status');
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = {
    name: function (v) { return v.trim() ? '' : 'Please enter your name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email address.';
      return emailPattern.test(v.trim()) ? '' : 'Please enter a valid email address, for example name@domain.com.au.';
    },
    message: function (v) { return v.trim() ? '' : 'Please tell us a little about the job.'; }
  };

  function showError(field, message) {
    var errorEl = document.getElementById(field.id + '-error');
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
    } else {
      field.removeAttribute('aria-invalid');
      if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
    }
  }

  function validateField(field) {
    var rule = rules[field.name];
    if (!rule) return true;
    var msg = rule(field.value);
    showError(field, msg);
    return !msg;
  }

  function setStatus(type, html) {
    if (!statusBox) return;
    statusBox.className = 'rounded-md p-4 text-[15px] ' + (type === 'error' ? 'status-error' : 'status-info');
    statusBox.innerHTML = html;
  }

  if (form) {
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('blur', function () {
        if (field.value.trim() || field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        var field = form.elements[name];
        if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        setStatus('error', '<strong>Please check the highlighted fields.</strong> Your enquiry has not been submitted.');
        firstInvalid.focus();
        return;
      }

      setStatus('info',
        '<strong>Your enquiry has not been sent.</strong> Your details look complete, but this form is not connected yet, ' +
        'so nothing has been sent to us or stored. Please keep a copy of your message.');
    });
  }

  /* ---------- Current year ---------- */
  var year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = year; });
})();
