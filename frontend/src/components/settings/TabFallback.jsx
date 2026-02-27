import { Loader2 } from 'lucide-react';

/**
 * TabFallback Component
 * Loading spinner for lazy-loaded tab panels
 */
export default function TabFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );
}
