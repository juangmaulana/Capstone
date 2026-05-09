
async function testApi() {
  const terms = ["lantana camara", "Vachellia Nilotica", "mikania micrantha", "chromolaena odorata", "ageratum conyzoides"];
  for (const term of terms) {
    const url = `http://localhost:3000/api/v1/plants?search=${encodeURIComponent(term)}&limit=1`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log(`Term: "${term}", Found: ${json.data && json.data.length > 0}`);
    } catch (err) {
      console.log(`Term: "${term}", Error: ${err.message}`);
    }
  }
}
testApi();
