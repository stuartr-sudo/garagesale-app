import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards({ icon: Icon, title, value, description, bgColor }) {
  return (
    <Card className={`text-white overflow-hidden rounded-2xl shadow-lg border border-gray-800 ${bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-black/20 p-3 rounded-xl">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-300">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 truncate">{description}</p>
      </CardContent>
    </Card>
  );
}