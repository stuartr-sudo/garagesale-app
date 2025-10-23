import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function CollectionAcknowledgment({ 
  item, 
  onAcknowledge, 
  acknowledged 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Collection Details</h2>
        <p className="text-gray-400">Please review the collection information before proceeding with payment.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-sm font-medium text-gray-300">Collection Date</Label>
              <p className="text-white font-medium">
                {item.collection_date 
                  ? format(new Date(item.collection_date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
                  : 'Not specified'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-sm font-medium text-gray-300">Collection Address</Label>
              <p className="text-white">
                {item.collection_address || 'Address to be provided by seller'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <Label className="text-sm font-medium text-gray-300">Item Details</Label>
              <p className="text-white">{item.title}</p>
              <p className="text-gray-400 text-sm">${item.price}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-medium mb-2">Important Information</h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• You must collect the item on the specified date</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Payment must be completed before collection</li>
              <li>• Contact the seller if you need to reschedule</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <Checkbox
          id="collection-acknowledge"
          checked={acknowledged}
          onCheckedChange={onAcknowledge}
          className="mt-1"
        />
        <div className="flex-1">
          <Label 
            htmlFor="collection-acknowledge" 
            className="text-sm text-gray-300 cursor-pointer"
          >
            I acknowledge that I have read and understand the collection details above. 
            I agree to collect the item on the specified date and time, and understand 
            that payment must be completed before collection.
          </Label>
        </div>
      </div>
    </div>
  );
}
