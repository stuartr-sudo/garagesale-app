import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Eye, EyeOff, CheckCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
    active: { text: "Active", color: "bg-lime-900/50 text-lime-300 border-lime-700" },
    sold: { text: "Sold", color: "bg-blue-900/50 text-blue-300 border-blue-700" },
    pending: { text: "Pending", color: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
    inactive: { text: "Inactive", color: "bg-gray-700 text-gray-300 border-gray-700" }
};

const conditionColors = {
  new: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  like_new: "bg-blue-900/50 text-blue-300 border-blue-700",
  good: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  fair: "bg-orange-900/50 text-orange-300 border-orange-700",
  poor: "bg-red-900/50 text-red-300 border-red-700"
};

export default function MyItemCard({ item, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  const currentStatus = statusConfig[item.status] || statusConfig.inactive;

  const handleCardClick = () => {
    navigate(createPageUrl(`ItemDetail/${item.id}`));
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full cursor-pointer ring-1 ring-cyan-400/20 hover:ring-cyan-400/40"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={primaryImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${currentStatus.color} shadow-md`}>
            {currentStatus.text}
          </Badge>
          {item.condition && (
            <Badge className={`${conditionColors[item.condition]} shadow-md capitalize`}>
              {item.condition.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800/90 hover:bg-gray-700 shadow-md text-white rounded-full h-8 w-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(createPageUrl(`EditItem/${item.id}`)); 
                }} 
                className="text-white hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Item
              </DropdownMenuItem>
              {item.status === "active" && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("inactive"); }} className="text-white hover:bg-gray-700">
                  <EyeOff className="w-4 h-4 mr-2" />
                  Mark as Inactive
                </DropdownMenuItem>
              )}
              {item.status === "inactive" && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("active"); }} className="text-white hover:bg-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  Mark as Active
                </DropdownMenuItem>
              )}
              {item.status !== "sold" && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange("sold"); }} className="text-white hover:bg-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Sold
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:bg-gray-700 focus:bg-red-900/50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <CardContent className="p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-lg text-white line-clamp-1">
              {item.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-cyan-400">
              ${item.price}
            </div>
            <div className="text-sm text-gray-500">
              Listed {format(new Date(item.created_at), 'MMM d')}
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                  #{tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                  +{item.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}