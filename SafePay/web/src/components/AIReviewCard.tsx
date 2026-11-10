export function AIReviewCard({ score, checks, consensus, status }: {
  score: number,
  checks: { label: string, ok: boolean }[],
  consensus?: string,
  status?: string
}) {
  const color = score >= 80 ? "bg-mint border-emerald-200" : score >= 60 ? "bg-peach border-orange-200" : "bg-blush border-rose-200";
  const ring = score >= 80 ? "text-emerald-700" : score >= 60 ? "text-orange-700" : "text-rose-700";
  const msg = score >= 80 ? "Ready to release — great match!" : score >= 60 ? "Almost there — ask for 1 revision, then release." : "Needs work — 2 requirements missed. Consider dispute.";
  return (
    <div className={`rounded-card border-2 ${color} p-5 shadow-sm max-w-md mx-auto`}>
      <div className="flex justify-between text-xs text-gray-500 mb-2"><span>✨ AI Review</span><span>2 min ago • {consensus || "3 jurors agree"}</span></div>
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center text-xl font-bold ${ring} border-2 border-white shadow`}>{score}%</div>
        <div><div className="font-semibold">{checks.filter(c=>c.ok).length} of {checks.length} ready</div><div className="text-sm text-gray-600">{status || "Consensus • Human decides"}</div></div>
      </div>
      <div className="space-y-1 mb-3 bg-white/70 rounded-xl p-3">
        {checks.map((c,i)=><div key={i} className="flex items-center gap-2 text-sm"><span className={c.ok?"text-emerald-600":"text-orange-600"}>{c.ok?"✓":"✗"}</span><span className={c.ok?"":"opacity-60"}>{c.label}</span></div>)}
      </div>
      <div className="bg-white rounded-xl p-3 text-sm italic">"{msg}"</div>
      <div className="text-[10px] text-gray-500 mt-2">Review by Claude • Not final • Human decides • View reasoning →</div>
    </div>
  );
}
