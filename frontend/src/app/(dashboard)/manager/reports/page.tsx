import React from 'react';

export default function GenerateReportsPage() {
  const dummyData = [
    { id: 1, reportName: 'Monthly Sales Review', type: 'Sales', dateGenerated: '2026-03-01' },
    { id: 2, reportName: 'Expiry Stock List', type: 'Inventory', dateGenerated: '2026-03-15' },
  ];

  return (
    <div>
      <h1>Generate Reports</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Report Name</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Type</th>
            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Date Generated</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.reportName}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.type}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{row.dateGenerated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
