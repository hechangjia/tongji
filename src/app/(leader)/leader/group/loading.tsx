export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
        <p className="text-sm text-slate-500">正在加载本组信息...</p>
      </div>
    </div>
  );
}
