'use strict';

const jurisdiction = document.getElementById('jurisdiction');
const topic = document.getElementById('legal-topic');
const searchLink = document.getElementById('attorney-web-search');
const illinoisResources = document.getElementById('illinois-resources');

const jurisdictions = Object.entries(STATE_DATA).sort(([, a], [, b]) => a.name.localeCompare(b.name));
for (const [code, state] of jurisdictions) {
  jurisdiction.add(new Option(state.name, code));
}

function updateAttorneySearch() {
  const stateName = STATE_DATA[jurisdiction.value]?.name;
  const terms = ['nonprofit attorney', topic.value, stateName].filter(Boolean);
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', terms.join(' '));
  searchLink.href = url.href;
  illinoisResources.hidden = Boolean(jurisdiction.value && jurisdiction.value !== 'IL');
}

jurisdiction.addEventListener('change', updateAttorneySearch);
topic.addEventListener('change', updateAttorneySearch);
updateAttorneySearch();
document.getElementById('attorney-search').hidden = false;
