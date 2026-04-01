fetch('https://rsag2.pages.dev/api/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: "admin", password: "rsag2025!" })
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(e => console.error("Error:", e));
