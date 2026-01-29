import { observer } from "mobx-react-lite";
import { loadingState } from "../router";

export const LoadingOverlay = observer(() => {
  if (!loadingState.isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        
        {/* Message */}
        <p className="text-gray-700 font-medium">
          {loadingState.message || "Loading..."}
        </p>
        
        {/* Subtitle */}
        <p className="text-gray-500 text-sm">
          Using interceptAsync to fetch data
        </p>
      </div>
    </div>
  );
});
