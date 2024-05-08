function navigateToPage(url, scriptSource) {
  fetch(url)
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.text();
      })
      .then(html => {
          // Replace the content of the container with the fetched HTML
          const oldNavigationScript = document.getElementById('navigationScript');
          if (oldNavigationScript) {
            oldNavigationScript.remove();
        }
        if (scriptSource) {
          addScript(scriptSource);
        }


        // eslint-disable-next-line no-undef
        document.getElementById('navigationdiv').innerHTML = html;
        window.history.pushState('object or string', '', url);
      })
      .catch(error => {
          console.error('Error loading page:', error);
      });
}


function addScript(scriptPath) {
  var script = document.createElement('script');
  script.async = true;
  script.id = 'navigationScript';
  script.src = scriptPath;
  document.head.append(script);
  script.remove();
}
