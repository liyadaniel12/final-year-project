import React from 'react';

export default function SalesRecordsPage() {
  const dummyData = [
    { id: 1, product: 'Milk', qty: 10, branch: 'Branch A', date: '2026-03-25' },
    { id: 2, product: 'Cheese', qty: 5, branch: 'Main', date: '2026-03-26' },
  ];

  return (
    <div>
      <h1>Sales Records</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Product</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Quantity Sold</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Branch</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.product}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.qty}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.branch}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
