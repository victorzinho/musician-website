import 'waypoints/lib/noframework.waypoints';

// eslint-disable-next-line no-undef,no-new
new Waypoint({
  element: document.getElementById('skills'),
  offset: '80%',
  handler: () => [...document.querySelectorAll('.skill-container .progress-bar')].forEach(bar => {
    bar.style.width = bar.getAttribute('aria-valuenow') + '%';
  })
});
