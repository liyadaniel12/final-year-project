import fs from 'fs';

async function test() {
  const req = await fetch('http://localhost:9000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  const text = await req.text();
  fs.writeFileSync('req-out.json', text, 'utf8');
}
test();
