async function test() {
  const req = await fetch('http://localhost:9000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  const text = await req.text();
  console.log("Status:", req.status);
  console.log("Text:", text);
}
test();
