import React from 'react';

export default function StockOverviewPage() {
  const dummyData = [
    { id: 1, product: 'Milk', sku: 'MILK-001', branch: 'Main', qty: 500, status: 'In Stock' },
    { id: 2, product: 'Cheese', sku: 'CHS-002', branch: 'Branch A', qty: 20, status: 'Low' },
  ];

  return (
    <div>
      <h1>Stock Overview</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Product Name</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>SKU</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Branch</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Stock Quantity</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.product}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.sku}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.branch}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.qty}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
