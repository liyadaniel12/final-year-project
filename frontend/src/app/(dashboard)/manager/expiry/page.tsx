import React from 'react';

export default function ExpiryAnalysisPage() {
  const dummyData = [
    { id: 1, product: 'Milk', batch: 'BATCH-001', expiry: '2026-04-01', status: 'Near Expiry' },
    { id: 2, product: 'Yogurt', batch: 'BATCH-002', expiry: '2026-03-20', status: 'Expired' },
  ];

  return (
    <div>
      <h1>Expiry Analysis</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Product</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Batch Number</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Expiry Date</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.product}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.batch}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.expiry}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
