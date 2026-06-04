const query = 'Kaggadasapura';
fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`, {
  headers: {
    'User-Agent': 'FamilyTreeApp/1.0 (test@example.com)'
  }
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data.map(d => d.display_name), null, 2)))
  .catch(err => console.error(err));
