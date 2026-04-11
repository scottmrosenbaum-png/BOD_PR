"use client";
import { useState, useEffect, useRef } from "react";

interface NarrativeField {
  id: string;
  label: string;
  size: "small" | "tall";
  type?: "dropdown";
  placeholder?: string;
  hasCoach?: boolean | "static";
}

const ANNOUNCEMENT_TYPES = [
  { type: "Brand Launch", emoji: "🚀" },
  { type: "New Hire", emoji: "👤" },
  { type: "New Product / Flavor", emoji: "🍷" },
  { type: "Distribution / Expansion", emoji: "🗺️" },
  { type: "Investment / M&A", emoji: "💰" }
];

const INVESTMENT_ROUNDS = ["Angel", "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Bridge", "Debt"];

export default function Home() {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"pr" | "pitch" | "social">("pr");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audit, setAudit] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  
  const [formData, setFormData] = useState({
    announcementType: "", 
    companyName: "", 
    newsHook: "", 
    newsImpact: "", 
    quoteName: "", 
    quoteTitle: "", 
    quoteText: "", 
    boilerplate: "", 
    eventSpecific: {} as any
  });

  // --- COACH LOGIC ---
  const getHookTip = () => {
    const hook = formData.newsHook.toLowerCase();
    if (!hook) return "💡 Tip: Start with the most important facts (Who/What/When).";
    if (hook.length < 60) return "⚠️ Needs more meat: Include the 'Why'—how does this impact the market?";
    return "✅ Solid Hook: Factual and news-oriented.";
  };

  const getQuoteTip = () => {
    const quote = formData.quoteText.toLowerCase();
    if (!quote) return "💡 Tip: Quotes should show vision, not just repeat facts.";
    if (quote.includes("excited") || quote.includes("proud")) return "⚠️ PR Cliche: Try avoiding 'Proud' or 'Excited'.";
    return "✅ Dynamic Quote: Authentically visionary.";
  };

  const getBoilerplateTip = () => {
    const bp = formData.boilerplate.toLowerCase();
    if (!bp) return "💡 Tip: Include founding history, location, and core mission.";
    const urlPattern = /(https?:\/\/|www\.)[^\s/$.?#].[^\s]*/;
    if (!urlPattern.test(bp)) return "🚨 Missing Link: Every boilerplate needs a website URL.";
    return "✅ Robust Boilerplate.";
  };

  const getTargetAudienceTip = () => {
    const val = formData.eventSpecific.audience || "";
    if (!val) return "💡 Tip: Be specific—e.g., 'The eco-conscious Gen Z spirits enthusiast'.";
    if (val.toLowerCase().includes("everyone")) return "🚫 Avoid 'everyone'. Who is the primary buyer?";
    return "✅ Targeted Audience defined.";
  };

  const getFeaturesTip = () => {
    const val = formData.eventSpecific.features || "";
    if (!val) return "💡 Tip: Mention taste profile, ABV, or unique production methods.";
    if (val.length < 25) return "⚠️ Be more descriptive for better PR impact.";
    return "✅ Detailed features provided.";
  }

  const getFieldCoach = (id: string, value: string = "") => {
    if (!value) return null;
    const v = value.toLowerCase();
    switch (id) {
      case "expectedImpact": return v.length < 30 ? "💡 Tip: What's the #1 goal for this hire?" : "✅ Strategic focus.";
      case "benefit": return v.length < 30 ? "⚠️ Why this partner? Mention their specific expertise." : "✅ Strong context.";
      case "utility": return v.length < 40 ? "⚠️ Mention specific scaling goals (inventory, marketing, etc)." : "✅ Clear roadmap.";
      default: return null;
    }
  };

  const getFieldsByType = (type: string): NarrativeField[] => {
    switch (type) {
      case "Brand Launch":
      case "New Product / Flavor":
        return [
          { id: "brandName", label: "Brand Name", size: "small" },
          { id: "launchDate", label: "Launch Date", size: "small" },
          { id: "launchLocation", label: "Launch Location", size: "small" },
          { id: "category", label: "Product Category/Type", size: "small" },
          { id: "features", label: "Product Features", placeholder: "Flavor, ingredients...", hasCoach: "static", size: "tall" },
          { id: "audience", label: "Target Audience", placeholder: "Who is this for?", hasCoach: "static", size: "tall" },
        ];
      case "New Hire":
        return [
          { id: "hireName", label: "Hire Name", size: "small" },
          { id: "hireTitle", label: "Hire Title", size: "small" },
          { id: "prevExp", label: "Previous Experience", size: "tall" },
          { id: "expectedImpact", label: "Expected Impact", hasCoach: true, size: "tall" },
        ];
      case "Distribution / Expansion":
        return [
          { id: "brandName", label: "Brand Name", size: "small" },
          { id: "startDate", label: "Start Date", size: "small" },
          { id: "geography", label: "Geography", size: "small" },
          { id: "partner", label: "Partner Name", size: "small" },
          { id: "benefit", label: "Benefit of Partnership", hasCoach: true, size: "tall" },
          { id: "category", label: "Category", size: "small" },
        ];
      case "Investment / M&A":
        return [
          { id: "brandName", label: "Brand Name", size: "small" },
          { id: "startDate", label: "Date", size: "small" },
          { id: "investors", label: "Investors", size: "small" },
          { id: "round", label: "Round", type: "dropdown", size: "small" },
          { id: "amount", label: "Amount", size: "small" },
          { id: "utility", label: "Use of Funds", hasCoach: true, size: "tall" },
        ];
      default: return [];
    }
  };

  const isCoreReady = formData.companyName.length > 2 && formData.newsHook.length > 20;

  async function goToAudit() {
    setLoading(true);
    try {
      const [auditRes, clarifyRes] = await Promise.all([
        fetch("/api/generate-press-release", { method: "POST", body: JSON.stringify({ ...formData, stage: "audit" }) }),
        fetch("/api/generate-press-release", { method: "POST", body: JSON.stringify({ ...formData, stage: "clarify" }) })
      ]);
      const auditData = await auditRes.json();
      const clarifyData = await clarifyRes.json();
      setAudit({ score: auditData.score, feedback: auditData.feedback }); 
      setQuestions(clarifyData.questions || []);
      setStep(4);
    } finally { setLoading(false); }
  }

  async function finalGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-press-release", { 
        method: "POST", 
        body: JSON.stringify({ ...formData, clarifyingAnswers: answers, stage: "final", style: "warm_journalist_pitch" }) 
      });
      setResult(await res.json());
      setStep(5);
    } finally { setLoading(false); }
  }

  const handleCopy = () => {
    let text = activeTab === 'pr' 
      ? `${result.press_release?.headline}\n\n${result.press_release?.body}\n\n###\n\nAbout ${formData.companyName}:\n${formData.boilerplate}` 
      : activeTab === 'pitch' ? result.media_pitch : result.linkedin_post;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputS = "w-full p-4 bg-white border-2 border-zinc-100 rounded-xl font-bold focus:border-[#FF8C00] outline-none transition-all placeholder:text-zinc-300 placeholder:font-normal text-sm";
  const tallInputS = "w-full p-4 bg-white border-2 border-zinc-100 rounded-xl font-bold focus:border-[#FF8C00] outline-none transition-all min-h-[140px] text-sm";
  const labelS = "block text-[10px] font-black uppercase text-[#FF8C00] mb-1 tracking-widest";

  const CoachBox = ({ tip }: { tip: string }) => {
    if (!tip) return null;
    const isSuccess = tip.startsWith("✅");
    const isError = tip.startsWith("🚫") || tip.startsWith("🚨");
    let bgColor = isSuccess ? "bg-green-50 border-green-100 text-green-700" : isError ? "bg-red-50 border-red-100 text-red-700" : "bg-orange-50 border-orange-100 text-orange-700";
    return <div className={`mt-2 p-3 rounded-xl border ${bgColor}`}><span className="text-[10px] font-black uppercase italic leading-tight">{tip}</span></div>;
  };

  return (
    <main className="min-h-screen bg-zinc-50 py-12 px-4 font-sans text-zinc-900">
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 flex flex-col min-h-[700px]">
        
        <nav className="flex w-full bg-zinc-50 border-b border-zinc-100">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex-1 py-5 text-center text-[10px] font-black tracking-widest ${step >= s ? 'text-[#FF8C00] border-b-4 border-[#FF8C00]' : 'text-zinc-300'}`}>STEP 0{s}</div>
          ))}
        </nav>

        <div className="px-8 md:px-12 py-8 flex-grow">
          {step === 1 && (
            <div className="max-w-4xl mx-auto py-6 animate-in fade-in">
              <div className="text-center mb-16">
                <h1 className="text-6xl font-black italic uppercase mb-4 tracking-tighter">Business of Drinks PR</h1>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2 px-6 py-3 bg-zinc-100 rounded-full">
                    <span className="text-xl">⏱️</span>
                    <span className="text-[10px] font-black uppercase text-zinc-600">4-7 Minutes To Complete</span>
                  </div>
                </div>
              </div>
              <div className="text-center mb-10"><h2 className="text-xl font-black uppercase italic tracking-widest text-[#FF8C00]">Select an Announcement Type</h2></div>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <button key={t.type} onClick={() => { setFormData({...formData, announcementType: t.type}); setStep(2); }} className="p-8 border-2 border-zinc-100 rounded-[2.5rem] font-black hover:border-[#FF8C00] bg-white text-left uppercase transition-all flex items-center gap-6 group shadow-sm hover:shadow-2xl hover:-translate-y-1">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{t.emoji}</span>
                    <div className="flex-grow"><span className="block text-zinc-900 group-hover:text-[#FF8C00] text-lg">{t.type}</span></div>
                    <span className="text-zinc-300 group-hover:text-[#FF8C00] text-2xl">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
              <h3 className="text-2xl font-black italic uppercase text-[#FF8C00]">{formData.announcementType}: Hook & Voice</h3>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div>
                    <label className={labelS}>Company Name</label>
                    <input className={inputS} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. Highland Spirits Co." />
                  </div>
                  <div>
                    <label className={labelS}>The News Hook</label>
                    <textarea className={`${inputS} h-40`} value={formData.newsHook} onChange={e => setFormData({...formData, newsHook: e.target.value})} placeholder="What is the big story?" />
                    <CoachBox tip={getHookTip()} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelS}>Official Quote Details</label>
                    <div className="flex gap-2 mb-2">
                      <input className={inputS} value={formData.quoteName} onChange={e => setFormData({...formData, quoteName: e.target.value})} placeholder="Name" />
                      <input className={inputS} value={formData.quoteTitle} onChange={e => setFormData({...formData, quoteTitle: e.target.value})} placeholder="Title" />
                    </div>
                    <textarea className={`${inputS} h-32`} value={formData.quoteText} onChange={e => setFormData({...formData, quoteText: e.target.value})} placeholder="The visionary vision..." />
                    <CoachBox tip={getQuoteTip()} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <h3 className="text-2xl font-black italic uppercase text-[#FF8C00]">Industry Narrative Details</h3>
              <div className="bg-zinc-50 p-8 rounded-[3rem] border-2 border-zinc-100 grid md:grid-cols-2 gap-x-10 gap-y-4">
                {getFieldsByType(formData.announcementType).map((f) => (
                  <div key={f.id} className="space-y-1">
                    <label className={labelS}>{f.label}</label>
                    {f.type === "dropdown" ? (
                      <select className={inputS} value={formData.eventSpecific[f.id] || ""} onChange={e => setFormData({...formData, eventSpecific: {...formData.eventSpecific, [f.id]: e.target.value}})}>
                        <option value="">Select Round</option>
                        {INVESTMENT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <textarea 
                        className={f.size === 'tall' ? tallInputS : inputS} 
                        placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`} 
                        value={formData.eventSpecific[f.id] || ""} 
                        onChange={e => setFormData({...formData, eventSpecific: {...formData.eventSpecific, [f.id]: e.target.value}})} 
                      />
                    )}
                    {f.hasCoach === true && formData.eventSpecific[f.id] && (
                      <CoachBox tip={getFieldCoach(f.id, formData.eventSpecific[f.id]) || ""} />
                    )}
                    {f.hasCoach === "static" && (
                      <CoachBox tip={f.id === 'audience' ? getTargetAudienceTip() : getFeaturesTip()} />
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className={labelS}>About {formData.companyName} (Boilerplate)</label>
                <textarea className={`${inputS} h-28 text-xs font-normal`} value={formData.boilerplate} onChange={e => setFormData({...formData, boilerplate: e.target.value})} placeholder="History, location, mission..." />
                <CoachBox tip={getBoilerplateTip()} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <div className="bg-zinc-900 text-white p-8 rounded-[2rem] text-center shadow-2xl">
                <p className="text-xs font-black uppercase text-[#FF8C00]">Strategic Audit: {audit?.score}/10</p>
                <p className="italic font-bold text-lg mt-2">"{audit?.feedback}"</p>
              </div>
              {questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className={labelS}>{q}</label>
                  <textarea className={`${inputS} h-24`} value={answers[i]} onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} />
                </div>
              ))}
            </div>
          )}

          {step === 5 && result && (
            <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-zinc-900 pb-4">
                <h2 className="text-4xl font-black italic uppercase">The Package</h2>
                <button onClick={handleCopy} className="min-w-[180px] px-10 py-4 bg-[#FF8C00] text-white rounded-2xl font-black uppercase text-xs shadow-xl transition-all hover:bg-zinc-900 active:scale-95">{copied ? 'Copied!' : 'Copy To Clipboard'}</button>
              </div>
              <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl w-fit">
                {[{id: 'pr', label: 'Press Release'}, {id: 'pitch', label: 'Media Pitch'}, {id: 'social', label: 'Social Post'}].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-[#FF8C00] shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>{tab.label}</button>
                ))}
              </div>
              <div className="p-10 border-2 border-zinc-100 rounded-[3rem] bg-white min-h-[500px] shadow-sm">
                {activeTab === 'pr' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <h1 className="text-3xl font-black text-center uppercase tracking-tighter">{result.press_release?.headline}</h1>
                    <div className="text-sm font-black uppercase text-center border-y py-2 border-zinc-100">FOR IMMEDIATE RELEASE</div>
                    <div className="whitespace-pre-wrap leading-relaxed text-zinc-700 font-serif text-lg">
                      {result.press_release?.body}
                      {"\n\n###\n\n"}
                      <strong>About {formData.companyName}:</strong>{"\n"}
                      {formData.boilerplate}
                    </div>
                  </div>
                )}
                {activeTab === 'pitch' && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="whitespace-pre-wrap leading-relaxed text-zinc-800 font-sans text-base">
                      {result.media_pitch}
                    </div>
                  </div>
                )}
                {activeTab === 'social' && (
                  <div className="whitespace-pre-wrap text-zinc-700 font-sans text-base p-8 rounded-3xl bg-zinc-50 border border-zinc-100 animate-in fade-in duration-500">
                    {result.linkedin_post}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {step > 1 && (
          <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex gap-4">
            <button onClick={() => setStep(step - 1)} className="flex-1 py-5 bg-white border-2 border-zinc-200 font-black uppercase rounded-2xl text-sm transition-colors hover:border-zinc-300">Back</button>
            {step < 5 && (
              <button 
                onClick={step === 3 ? goToAudit : step === 4 ? finalGenerate : () => setStep(step + 1)} 
                disabled={loading || (step === 2 && !isCoreReady)} 
                className="flex-[3] py-5 bg-zinc-900 text-white font-black uppercase rounded-2xl text-sm shadow-xl transition-all disabled:opacity-50 hover:bg-black"
              >
                {loading ? "Synthesizing..." : "Continue →"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}