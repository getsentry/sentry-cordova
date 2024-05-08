document.addEventListener("backbutton", onBackKeyDown, false);


function onBackKeyDown() {
  navigateToPage('tabpage.html', 'js/tabpage.js');
  document.removeEventListener("backbutton", onBackKeyDown, false);
}

function wait(ms) {
  var start = Date.now(),
      now = start;
  while (now - start < ms) {
    now = Date.now();
  }
}

function doPerformanceMonitor() {
  // Start a Sentry transaction
  wait(100);
  Sentry.instance.startSpan({ name: 'example-transaction', op: 'example-operation' }, (span) =>
  {
    Sentry.instance.startSpan(({ op: 'example-span-operation' }), () => {
      wait(100);
    });
    wait(100);
  });
}
