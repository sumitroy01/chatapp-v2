import React from "react";

const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-slate-100" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
