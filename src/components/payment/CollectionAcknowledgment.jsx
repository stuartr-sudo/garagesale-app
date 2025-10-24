import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, AlertCircle, Clock, Lock } from 'lucide-react';
import { format, isAfter, subDays } from 'date-fns';

export default function CollectionAcknowledgment({ 
  item, 
  onAcknowledge, 
  acknowledged 
}) {
  // Check if collection address should be shown (24 hours before collection date)
  const shouldShowAddress = () => {
    if (!item.collection_date) return false;
    
    const collectionDate = new Date(item.collection_date);
    const now = new Date();
    const twentyFourHoursBefore = subDays(collectionDate, 1);
    
    return isAfter(now, twentyFourHoursBefore);
  };

  const showAddress = shouldShowAddress();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Collection Details</h2>
        <p className="text-gray-400 text-sm">Please review the collection information before proceeding with payment.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-xs font-medium text-gray-300">Collection Date</Label>
              <p className="text-white font-medium text-sm">
                {item.collection_date 
                  ? format(new Date(item.collection_date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
                  : 'Not specified'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-xs font-medium text-gray-300">Collection Address</Label>
              {showAddress ? (
                <p className="text-white text-sm">
                  {item.collection_address || 'Address to be provided by seller'}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-yellow-400" />
                  <p className="text-yellow-300 text-sm">
                    Address will be revealed 24 hours before collection date
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-xs font-medium text-gray-300">Item Details</Label>
              <p className="text-white text-sm">{item.title}</p>
              <p className="text-gray-400 text-xs">${item.price}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-medium mb-1 text-sm">Important Information</h3>
            <ul className="text-yellow-200 text-xs space-y-1">
              <li>• You must collect the item on the specified date</li>
              <li>• Collection address will be revealed 24 hours before collection</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Payment must be completed before collection</li>
              <li>• Contact the seller if you need to reschedule</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-4">
        <Checkbox
          id="collection-acknowledge"
          checked={acknowledged}
          onCheckedChange={onAcknowledge}
          className="mt-1 w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 flex-shrink-0"
        />
        <div className="flex-1">
          <Label 
            htmlFor="collection-acknowledge" 
            className="text-xs text-gray-300 cursor-pointer leading-relaxed block"
          >
            I acknowledge that I have read and understand the collection details above. 
            I agree to collect the item on the specified date and time, understand that 
            the collection address will be revealed 24 hours before collection, and that 
            payment must be completed before collection.
          </Label>
        </div>
      </div>
    </div>
  );
}
