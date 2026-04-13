"use client";
import { useState, useEffect } from "react";

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
    if (!hook) return "💡 Tip: Start with the most important facts.";
    if (hook.length < 60) return "⚠️ Needs more meat: Include the 'Why'.";
    return "✅ Solid Hook.";
  };

  const getQuoteTip = () => {
    const quote = formData.quoteText.toLowerCase();
    if (!quote) return "💡 Tip: Quotes should show vision.";
    if (quote.includes("excited") || quote.includes("proud")) return "⚠️ PR Cliche: Try avoiding 'Proud'.";
    return "✅ Dynamic Quote.";
  };

  const getBoilerplateTip = () => {
    const bp = formData.boilerplate.toLowerCase();
    if (!bp) return "💡 Tip: Include founding history and website.";
    if (!bp.includes("http")) return "🚨 Missing Link: Add a website URL.";
    return "✅ Robust Boilerplate.";
  };

  const getFieldsByType = (type: string): NarrativeField[] => {
    switch (type) {
      case "Brand Launch":
      case "New Product / Flavor":
        return [
          { id: "brandName", label: "Brand Name", size: "small" },
          { id: "launchDate", label: "Launch Date", size: "small" },
          { id: "category", label: "Product Category", size: "small" },
          { id: "features", label: "Product Features", hasCoach: "static", size: "tall" },
          { id: "audience", label: "Target Audience", hasCoach: "static", size: "tall" },
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
          { id: "geography", label: "Geography", size: "small" },
          { id: "partner", label: "Partner Name", size: "small" },
          { id: "benefit", label: "Benefit of Partnership", hasCoach: true, size: "tall" },
        ];
      case "Investment / M&A":
        return [
          { id: "brandName", label: "Brand Name", size: "small" },
          { id: "investors", label: "Investors", size: "small" },
          { id: "round", label: "Round", type: "dropdown", size: "small" },
          { id: "utility", label: "Use of Funds", hasCoach: true, size: "tall" },
        ];
      default: return [];
    }
  };

  async function goToAudit() {
    setLoading(true);
    try {
      const [auditRes, clarifyRes] = await Promise.all([
        fetch("/api/generate-press-release", { method: "POST", body: JSON.stringify({ ...formData, stage: "audit" }) }),
        fetch("/api/generate-press-release", { method: "POST", body: JSON.stringify({ ...formData, stage: "clarify" }) })
      ]);
      const auditData = await auditRes.json();
      const clarifyData = await clarifyRes.json();
      setAudit(auditData); 
      setQuestions(clarifyData.questions || []);
      setStep(4);
    } catch (err) { alert("AI stalled. Check OpenAI balance."); }
    finally { setLoading(false); }
  }

  async function finalGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-press-release", { 
        method: "POST", 
        body: JSON.stringify({ ...formData, clarifyingAnswers: answers, stage: "final" }) 
      });
      const data = await res.json();
      // Safeguard: Ensure social media post is mapped correctly regardless of key name
      const formattedResult = {
        ...data,
        social_display: data.linkedin_post || data.social_post || data.social || "Social post generation failed."
      };
      setResult(formattedResult);
      setStep(5);
    } catch (err) { alert("Generation failed."); }
    finally { setLoading(false); }
  }

  const handleCopy = () => {
    let text = "";
    if (activeTab === 'pr') text = `${result.press_release?.headline}\n\n${result.press_release?.body}`;
    if (activeTab === 'pitch') text = result.media_pitch;
    if (activeTab === 'social') text = result.social_display;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputS = "w-full p-4 bg-white border-2 border-zinc-100 rounded-xl font-bold focus:border-[#FF8C00] outline-none text-sm";
  const labelS = "block text-[10px] font-black uppercase text-[#FF8C00] mb-1 tracking-widest";
  const editableBoxS = "w-full p-8 bg-white border-none focus:ring-0 outline-none font-serif text-lg leading-relaxed text-zinc-700 min-h-[600px] resize-none";

  return (
    <main className="min-h-screen bg-zinc-50 py-12 px-4 font-sans text-zinc-900">
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 flex flex-col min-h-[800px]">
        
        <nav className="flex w-full bg-zinc-50 border-b border-zinc-100">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex-1 py-5 text-center text-[10px] font-black tracking-widest ${step >= s ? 'text-[#FF8C00] border-b-4 border-[#FF8C00]' : 'text-zinc-300'}`}>STEP 0{s}</div>
          ))}
        </nav>

        <div className="px-8 md:px-12 py-8 flex-grow">
          {step === 1 && (
            <div className="max-w-4xl mx-auto py-12 text-center animate-in fade-in">
              <h1 className="text-6xl font-black italic uppercase mb-12 tracking-tighter">Business of Drinks PR</h1>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <button key={t.type} onClick={() => { setFormData({...formData, announcementType: t.type}); setStep(2); }} className="p-8 border-2 border-zinc-100 rounded-[2.5rem] font-black hover:border-[#FF8C00] bg-white uppercase transition-all flex items-center gap-6 group">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{t.emoji}</span>
                    <span className="text-zinc-900 text-lg">{t.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
              <h3 className="text-2xl font-black italic uppercase text-[#FF8C00]">{formData.announcementType}</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div><label className={labelS}>Company Name</label><input className={inputS} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
                  <div><label className={labelS}>News Hook</label><textarea className={`${inputS} h-40`} value={formData.newsHook} onChange={e => setFormData({...formData, newsHook: e.target.value})} /><div className="mt-2 text-[10px] font-bold text-orange-600 uppercase italic">{getHookTip()}</div></div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1"><label className={labelS}>Person to be Quoted</label><input className={inputS} value={formData.quoteName} onChange={e => setFormData({...formData, quoteName: e.target.value})} /></div>
                    <div className="flex-1"><label className={labelS}>Their Job Title</label><input className={inputS} value={formData.quoteTitle} onChange={e => setFormData({...formData, quoteTitle: e.target.value})} /></div>
                  </div>
                  <div><label className={labelS}>Quote Text</label><textarea className={`${inputS} h-32`} value={formData.quoteText} onChange={e => setFormData({...formData, quoteText: e.target.value})} /><div className="mt-2 text-[10px] font-bold text-orange-600 uppercase italic">{getQuoteTip()}</div></div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
              <div className="grid md:grid-cols-2 gap-6 bg-zinc-50 p-8 rounded-[2rem] border-2 border-zinc-100">
                {getFieldsByType(formData.announcementType).map((f) => (
                  <div key={f.id}>
                    <label className={labelS}>{f.label}</label>
                    {f.type === "dropdown" ? (
                      <select className={inputS} value={formData.eventSpecific[f.id] || ""} onChange={e => setFormData({...formData, eventSpecific: {...formData.eventSpecific, [f.id]: e.target.value}})}>
                        <option value="">Select Round</option>
                        {INVESTMENT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <textarea className={f.size === 'tall' ? "w-full p-4 bg-white border-2 border-zinc-100 rounded-xl font-bold min-h-[100px] text-sm" : inputS} value={formData.eventSpecific[f.id] || ""} onChange={e => setFormData({...formData, eventSpecific: {...formData.eventSpecific, [f.id]: e.target.value}})} />
                    )}
                  </div>
                ))}
              </div>
              <div><label className={labelS}>About Company (Boilerplate)</label><textarea className={`${inputS} h-28 font-normal`} value={formData.boilerplate} onChange={e => setFormData({...formData, boilerplate: e.target.value})} /><div className="mt-2 text-[10px] font-bold text-orange-600 uppercase italic">{getBoilerplateTip()}</div></div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <div className="bg-zinc-900 text-white p-8 rounded-[2rem] text-center">
                <p className="text-xs font-black uppercase text-[#FF8C00]">Strategic Score: {audit?.score}/10</p>
                <p className="italic font-bold text-lg mt-2">"{audit?.feedback}"</p>
              </div>
              {questions.map((q, i) => (
                <div key={i} className="space-y-2"><label className={labelS}>{q}</label><textarea className={`${inputS} h-24`} value={answers[i]} onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} /></div>
              ))}
            </div>
          )}

          {step === 5 && result && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-zinc-900 pb-4">
                <div>
                  <h2 className="text-4xl font-black italic uppercase italic">The Package</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">✨ Instructions: You can click and edit any text below directly before copying.</p>
                </div>
                <button onClick={handleCopy} className="min-w-[180px] px-10 py-4 bg-[#FF8C00] text-white rounded-2xl font-black uppercase text-xs shadow-xl transition-all hover:bg-zinc-900 active:scale-95">{copied ? 'Copied!' : 'Copy To Clipboard'}</button>
              </div>
              
              <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl w-fit">
                {[{id: 'pr', label: 'Press Release'}, {id: 'pitch', label: 'Media Pitch'}, {id: 'social', label: 'Social Post'}].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-[#FF8C00] shadow-sm' : 'text-zinc-400'}`}>{tab.label}</button>
                ))}
              </div>

              <div className="border-2 border-zinc-100 rounded-[3rem] bg-white overflow-hidden shadow-sm">
                {activeTab === 'pr' && (
                  <div className="flex flex-col">
                    <input className="w-full text-3xl font-black text-center uppercase tracking-tighter p-8 border-b border-zinc-100 outline-none bg-zinc-50/20" value={result.press_release?.headline || ""} onChange={(e) => setResult({...result, press_release: {...result.press_release, headline: e.target.value}})} />
                    <textarea className={editableBoxS} value={result.press_release?.body || ""} onChange={(e) => setResult({...result, press_release: {...result.press_release, body: e.target.value}})} />
                  </div>
                )}

                {activeTab === 'pitch' && (
                  <textarea className={`${editableBoxS} font-sans text-base`} value={result.media_pitch || ""} onChange={(e) => setResult({...result, media_pitch: e.target.value})} />
                )}

                {activeTab === 'social' && (
                  <textarea className={`${editableBoxS} font-sans text-base bg-zinc-50/50`} value={result.social_display || ""} onChange={(e) => setResult({...result, social_display: e.target.value})} />
                )}
              </div>
            </div>
          )}
        </div>

        {step < 5 && (
          <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex gap-4">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 py-5 bg-white border-2 border-zinc-100 font-black uppercase rounded-2xl text-sm transition-colors">Back</button>}
            <button onClick={step === 3 ? goToAudit : step === 4 ? finalGenerate : () => setStep(step + 1)} disabled={loading} className="flex-[3] py-5 bg-zinc-900 text-white font-black uppercase rounded-2xl text-sm shadow-xl transition-all hover:bg-black">
              {loading ? "Synthesizing..." : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}