import React from 'react';

export default function CustomerFeedbackPage() {
  const dummyData = [
    { id: 1, name: 'John Doe', branch: 'Branch A', message: 'Product was fresh', date: '2026-03-25' },
    { id: 2, name: 'Jane Smith', branch: 'Branch B', message: 'Milk was near expiry', date: '2026-03-24' },
  ];

  return (
    <div>
      <h1>Customer Feedback</h1>
      
      <div style={{ marginTop: '20px', marginBottom: '30px' }}>
        <h3>Summary</h3>
        <ul>
          <li><strong>Total Feedback:</strong> 150</li>
          <li><strong>Feedback Today:</strong> 5</li>
          <li><strong>Feedback This Month:</strong> 42</li>
        </ul>
      </div>

      <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Customer Name</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Branch</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Message</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.name}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.branch}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.message}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
