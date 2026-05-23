'use client';

import { AlertOctagon, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  daysUntilExpiry: number;
  type?: string; // optional, e.g., 'Expired' or 'Near'
}

interface ExpiryAlertCardProps {
  alerts: Alert[];
}

export default function ExpiryAlertCard({ alerts }: ExpiryAlertCardProps) {
  const criticalAlerts = alerts.filter((a) => a.daysUntilExpiry <= 1);
  const nearAlerts = alerts.filter((a) => a.daysUntilExpiry > 1 && a.daysUntilExpiry <= 7);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold text-lg">Expiry Alerts</h3>
        </div>
        <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold">
          {alerts.length} Active
        </span>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <span className="text-4xl mb-2 block">✅</span>
            <p className="text-gray-500">No expiry alerts</p>
            <p className="text-sm text-gray-400 mt-1">All products are fresh</p>
          </div>
        ) : (
          <>
            {/* Critical */}
            {criticalAlerts.length > 0 && (
              <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                <p className="text-red-700 font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  CRITICAL – Expires Today/Tomorrow
                </p>
              </div>
            )}
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 bg-red-50 hover:bg-red-100 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-red-800">{alert.productName}</span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-mono">
                        {alert.batchNumber.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                      <span>📦 {alert.quantity} {alert.unit}</span>
                      <span>📅 Expires: {new Date(alert.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      {alert.daysUntilExpiry <= 0 ? 'EXPIRED TODAY' : `${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''} left`}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Near Expiry */}
            {nearAlerts.length > 0 && (
              <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-200">
                <p className="text-yellow-700 font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  NEAR EXPIRY – Within 7 days
                </p>
              </div>
            )}
            {nearAlerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 bg-yellow-50 hover:bg-yellow-100 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-yellow-800">{alert.productName}</span>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-mono">
                        {alert.batchNumber.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                      <span>📦 {alert.quantity} {alert.unit}</span>
                      <span>📅 Expires: {new Date(alert.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      {alert.daysUntilExpiry} day{alert.daysUntilExpiry !== 1 ? 's' : ''} left
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
            View all alerts →
          </button>
        </div>
      )}
    </div>
  );
}
