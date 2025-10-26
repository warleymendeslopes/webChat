"use client";

import { User } from "lucide-react";

interface LeadAttendantInfoProps {
  assignedTo?: string;
  attendantName?: string;
  isAdmin: boolean;
}

export default function LeadAttendantInfo({
  assignedTo,
  attendantName,
  isAdmin,
}: LeadAttendantInfoProps) {
  // Se não for admin, não mostra nada
  if (!isAdmin) {
    return null;
  }

  // Se não tem atendente atribuído
  if (!assignedTo) {
    return (
      <div className="flex items-center space-x-1 text-gray-500 text-xs">
        <User size={12} />
        <span>Sem atendente</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-blue-600 text-xs">
      <User size={12} />
      <span>{attendantName || `ID: ${assignedTo.slice(0, 8)}...`}</span>
    </div>
  );
}
