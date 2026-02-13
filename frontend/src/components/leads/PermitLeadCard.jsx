import React from 'react';
import { formatCurrency, formatDate } from '../../utils/format';

/**
 * PermitLeadCard - Display permit lead information with scoring
 */
export default function PermitLeadCard({ permit, onStatusUpdate, onViewDetails }) {
  // Get tier color and emoji
  const getTierStyle = (tier) => {
    switch (tier) {
      case 'hot':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', emoji: '🔥' };
      case 'warm':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', emoji: '🟡' };
      case 'cold':
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', emoji: '⚪' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', emoji: '⚫' };
    }
  };

  const tierStyle = getTierStyle(permit.leadTier);

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'quoted': return 'bg-purple-100 text-purple-700';
      case 'won': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      case 'dismissed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`${tierStyle.bg} ${tierStyle.border} border rounded-lg p-4 hover:shadow-md transition-shadow`}>
      {/* Header: Score Badge and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className={`${tierStyle.text} font-bold text-2xl flex items-center gap-2`}>
          <span>{tierStyle.emoji}</span>
          <span>{permit.leadScore}</span>
          <span className="text-sm font-normal uppercase">{permit.leadTier}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.leadStatus)}`}>
          {permit.leadStatus}
        </span>
      </div>

      {/* Contractor/Builder */}
      {permit.contractorName && (
        <div className="font-semibold text-gray-900 text-lg mb-1">
          🏗️ {permit.contractorName}
        </div>
      )}

      {/* Permit Type */}
      <div className="text-gray-700 font-medium mb-2">
        {permit.permitType}
      </div>

      {/* Address */}
      <div className="text-gray-600 text-sm mb-2">
        📍 {permit.address}, {permit.city} {permit.zipCode}
      </div>

      {/* Key Metrics */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        {permit.estimatedCost && (
          <div>💰 {formatCurrency(permit.estimatedCost)}</div>
        )}
        {permit.units && (
          <div>🏠 {permit.units} unit{permit.units > 1 ? 's' : ''}</div>
        )}
        {permit.squareFootage && (
          <div>📐 {permit.squareFootage.toLocaleString()} sqft</div>
        )}
      </div>

      {/* Description (truncated) */}
      {permit.description && (
        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
          {permit.description}
        </div>
      )}

      {/* Issue Date */}
      <div className="text-xs text-gray-500 mb-3">
        Issued: {formatDate(permit.issuedDate)} • Permit #{permit.permitNumber}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails && onViewDetails(permit)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        {permit.leadStatus === 'new' && (
          <button
            onClick={() => onStatusUpdate && onStatusUpdate(permit.id, 'contacted')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Mark Contacted
          </button>
        )}
      </div>
    </div>
  );
}
