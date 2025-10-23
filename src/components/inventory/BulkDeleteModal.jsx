import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Package,
  Shield,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BulkDeleteModal({ 
  isOpen, 
  onClose, 
  selectedItems, 
  onConfirm, 
  onCancel,
  isLoading = false 
}) {
  const [confirmText, setConfirmText] = useState('');
  const [understandRisks, setUnderstandRisks] = useState(false);
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!understandRisks) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm you understand the risks before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (confirmText !== 'DELETE') {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'DELETE' exactly as shown to confirm.",
        variant: "destructive"
      });
      return;
    }

    onConfirm();
  };

  const handleClose = () => {
    setConfirmText('');
    setUnderstandRisks(false);
    onClose();
  };

  const getItemStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'reserved': return 'bg-yellow-500';
      case 'sold': return 'bg-blue-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getItemStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'reserved': return 'Reserved';
      case 'sold': return 'Sold';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const canDeleteItems = selectedItems.filter(item => 
    item.status === 'active' || item.status === 'inactive'
  );

  const cannotDeleteItems = selectedItems.filter(item => 
    item.status === 'reserved' || item.status === 'sold'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Trash2 className="w-5 h-5 text-red-400" />
            Bulk Delete Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Alert */}
          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-200">
              <strong>Warning:</strong> This action cannot be undone. All selected items will be permanently deleted from your inventory.
            </AlertDescription>
          </Alert>

          {/* Selected Items Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Selected Items ({selectedItems.length})
            </h3>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <img 
                          src={item.image_urls[0]} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <p className="text-gray-400 text-xs">${item.price}</p>
                    </div>
                  </div>
                  <Badge className={`${getItemStatusColor(item.status)} text-white text-xs`}>
                    {getItemStatusText(item.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Items that cannot be deleted */}
          {cannotDeleteItems.length > 0 && (
            <Alert className="bg-yellow-900/20 border-yellow-500/30">
              <Clock className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                <strong>Note:</strong> {cannotDeleteItems.length} item(s) cannot be deleted because they are reserved or sold. 
                Only active and inactive items will be deleted.
              </AlertDescription>
            </Alert>
          )}

          {/* Deletion Summary */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Deletion Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Items that will be deleted:</span>
                <span className="text-red-400 font-semibold">{canDeleteItems.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Items that will be skipped:</span>
                <span className="text-yellow-400 font-semibold">{cannotDeleteItems.length}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="understand-risks"
              checked={understandRisks}
              onCheckedChange={setUnderstandRisks}
              className="mt-1"
            />
            <label htmlFor="understand-risks" className="text-sm text-gray-300 cursor-pointer">
              I understand that this action cannot be undone and I will lose all data associated with these items.
            </label>
          </div>

          {/* Confirmation Text Input */}
          <div>
            <label htmlFor="confirm-text" className="text-sm font-medium text-gray-300 mb-2 block">
              Type <code className="bg-gray-800 px-2 py-1 rounded text-red-400">DELETE</code> to confirm:
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !understandRisks || confirmText !== 'DELETE' || canDeleteItems.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {canDeleteItems.length} Item(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
