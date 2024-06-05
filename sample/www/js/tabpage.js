// Set defaults
tabSelector = document.getElementById("tab_selector");
tabSelector.children[0].classList.add('active');
tabRoot = document.getElementById('tab-root');
tabRoot.children[0].style.display = 'block';

document.addEventListener('deviceready', function () {
      // Hide loading overlay
      loader = document.querySelector('.loading-overlay');
      loader.style.display = 'flex';
      loader.style.visibility = 'visible';
      loader.style.opacity = '1';
  }, false);

  function selectTab(page, tab) {
      // Mark active tab.
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      tab.classList.add('active');

      // Show active tab.
      tabRoot = document.getElementById('tab-root');
      for (let child of tabRoot.children) {
        if (child.id === page) {
          child.style.display = 'block';
        } else {
          child.style.display = 'none';
        }
      }
  }
