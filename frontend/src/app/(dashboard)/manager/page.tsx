import React from 'react';

export default function ManagerOverviewPage() {
  const dummyData = [
    { id: 1, metric: 'Total Branches', value: 4 },
    { id: 2, metric: 'Total Products', value: 120 },
    { id: 3, metric: 'Total Stock', value: 5000 },
  ];

  return (
    <div>
      <h1>Overview</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Metric</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.metric}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
