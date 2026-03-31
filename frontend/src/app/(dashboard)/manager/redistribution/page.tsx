import React from 'react';

export default function RedistributionPage() {
  const dummyData = [
    { id: 1, product: 'Milk', from: 'Branch A', to: 'Branch B', qty: 50, status: 'Pending' },
    { id: 2, product: 'Yogurt', from: 'Main Warehouse', to: 'Branch C', qty: 100, status: 'Completed' },
  ];

  return (
    <div>
      <h1>Redistribution</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Product</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>From Branch</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>To Branch</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Quantity</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.product}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.from}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.to}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.qty}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
