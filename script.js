document.addEventListener('DOMContentLoaded', function() {
  const menuItems = document.querySelectorAll('.navigation-menu-item');
  let activeMenu = null;
  let closeTimeout = null;

  menuItems.forEach(item => {
    const trigger = item.querySelector('.navigation-menu-trigger');
    const content = item.querySelector('.navigation-menu-content');

    // Skip items without dropdown content (like the Documentation link)
    if (!content) return;

    // Mouse enter - open menu
    item.addEventListener('mouseenter', () => {
      clearTimeout(closeTimeout);
      openMenu(item, trigger, content);
    });

    // Mouse leave - close menu with delay
    item.addEventListener('mouseleave', () => {
      closeTimeout = setTimeout(() => {
        closeMenu(item, trigger, content);
      }, 100);
    });

    // Click toggle for touch devices
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      
      if (isOpen) {
        closeMenu(item, trigger, content);
      } else {
        // Close any other open menus first
        closeAllMenus();
        openMenu(item, trigger, content);
      }
    });

    // Keyboard navigation
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
          closeMenu(item, trigger, content);
        } else {
          closeAllMenus();
          openMenu(item, trigger, content);
        }
      } else if (e.key === 'Escape') {
        closeMenu(item, trigger, content);
        trigger.focus();
      } else if (e.key === 'ArrowDown' && trigger.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        const firstLink = content.querySelector('.navigation-menu-link');
        if (firstLink) firstLink.focus();
      }
    });

    // Keyboard navigation within content
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu(item, trigger, content);
        trigger.focus();
      }

      const links = content.querySelectorAll('.navigation-menu-link');
      const currentIndex = Array.from(links).indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % links.length;
        links[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? links.length - 1 : currentIndex - 1;
        links[prevIndex].focus();
      }
    });
  });

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navigation-menu-item')) {
      closeAllMenus();
    }
  });
  /* -------------------------
     Mobile navigation toggle
     ------------------------- */
  const mobileToggle = document.querySelector('.nav-toggle');
  const navRoot = document.querySelector('.navigation-menu');
  const mobileMenuList = document.querySelector('.navigation-menu-list');

  if (mobileToggle && navRoot) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

      if (isOpen) {
        navRoot.removeAttribute('data-open');
      } else {
        navRoot.setAttribute('data-open', 'true');
        // Ensure dropdowns are closed when mobile menu opens
        closeAllMenus();
      }
    });

    // Close mobile menu when clicking outside the nav
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navigation-menu')) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        navRoot.removeAttribute('data-open');
      }
    });

    // Close mobile menu when resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 560) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        navRoot.removeAttribute('data-open');
      }
    });

    // Close mobile menu when a link is clicked (improves UX)
    if (mobileMenuList) {
      mobileMenuList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          mobileToggle.setAttribute('aria-expanded', 'false');
          navRoot.removeAttribute('data-open');
        });
      });
    }
  }

  function openMenu(item, trigger, content) {
    // Close any other open menus
    if (activeMenu && activeMenu !== item) {
      const activeTrigger = activeMenu.querySelector('.navigation-menu-trigger');
      const activeContent = activeMenu.querySelector('.navigation-menu-content');
      closeMenu(activeMenu, activeTrigger, activeContent);
    }

    trigger.setAttribute('aria-expanded', 'true');
    // Make visible so we can measure and adjust positioning
    content.hidden = false;
    content.setAttribute('data-open', 'true');

    // Clear any previous inline positioning
    content.style.left = '';
    content.style.right = '';
    content.style.maxWidth = '';
    content.style.overflow = '';
    content.style.transformOrigin = '';

    // Position the dropdown centered under the trigger (relative to the parent <li>)
    const triggerRect = trigger.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const margin = 8; // minimal gap from viewport edges

    // Calculate left relative to the item so left: Xpx positions it under the trigger
    const desiredLeft = triggerRect.left - itemRect.left + (triggerRect.width - content.offsetWidth) / 2;
    content.style.left = `${Math.round(desiredLeft)}px`;
    content.style.right = 'auto';
    content.style.transformOrigin = 'center top';

    // Re-measure after positioning
    const rect = content.getBoundingClientRect();

    // If the dropdown overflows to the right, nudge it left or anchor to the right edge
    if (rect.right + margin > viewportWidth) {
      // Calculate how much we overflow and subtract from left
      const overflowRight = rect.right + margin - viewportWidth;
      const newLeft = Math.max((desiredLeft - overflowRight), margin - itemRect.left);
      content.style.left = `${Math.round(newLeft)}px`;
      content.style.transformOrigin = 'right top';
    }

    // If after adjustment it still overflows left, clamp to margin
    const rectAfter = content.getBoundingClientRect();
    if (rectAfter.left < margin) {
      const clampLeft = margin - itemRect.left;
      content.style.left = `${Math.round(clampLeft)}px`;
      content.style.transformOrigin = 'left top';
    }

    // Ensure the dropdown never exceeds viewport width
    const maxAvailable = viewportWidth - margin * 2;
    if (content.offsetWidth > maxAvailable) {
      content.style.maxWidth = `${maxAvailable}px`;
      content.style.overflow = 'auto';
    }

    content.classList.remove('closing');
    content.classList.add('opening');
    activeMenu = item;
  }

  function closeMenu(item, trigger, content) {
    trigger.setAttribute('aria-expanded', 'false');
    content.setAttribute('data-open', 'false');
    content.classList.remove('opening');
    content.classList.add('closing');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (content.getAttribute('data-open') === 'false') {
        content.hidden = true;
        content.classList.remove('closing');
        // Clear any inline positioning/styles we added when opening
        content.style.left = '';
        content.style.right = '';
        content.style.maxWidth = '';
        content.style.overflow = '';
        content.style.transformOrigin = '';
      }
    }, 150);
    
    if (activeMenu === item) {
      activeMenu = null;
    }
  }

  function closeAllMenus() {
    menuItems.forEach(item => {
      const trigger = item.querySelector('.navigation-menu-trigger');
      const content = item.querySelector('.navigation-menu-content');
      if (content && trigger.getAttribute('aria-expanded') === 'true') {
        closeMenu(item, trigger, content);
      }
    });
  }
});