document.addEventListener("backbutton", onBackKeyDown, false);


function onBackKeyDown() {
  navigateToPage('tabpage.html', 'js/tabpage.js');
  document.removeEventListener("backbutton", onBackKeyDown, false);
}

function doPerformanceMonitor() {
  // Start a Sentry transaction
  const transaction = Sentry.instance.startTransaction({ name: 'example-transaction', op: 'example-operation' });

  // Create a span inside the transaction
  const span = transaction.startChild({ op: 'example-span-operation' });

  // Simulate some work within the span
  setTimeout(() => {
    // Finish the span after 3 seconds
    span.finish();

    // Finish the transaction after all work is done
    transaction.finish();
  }, 3000);
}
