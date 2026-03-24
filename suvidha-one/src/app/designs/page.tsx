"use client";

import { useAppStore } from "@/store";
import { LayoutGrid, FileCode, CheckCircle, ExternalLink } from "lucide-react";

const DESIGNS = [
  { title: "Landing", file: "Landing.html", description: "Main entry point with multilingual support" },
  { title: "Authentication", file: "Authentication.html", description: "Secure login and identity verification" },
  { title: "Language Selection", file: "Language_Selection.html", description: "Choose from 10+ regional languages" },
  { title: "Dashboard Search", file: "Dashboard_Search.html", description: "Enhanced service discovery dashboard" },
  { title: "Department Search", file: "Department_Search.html", description: "Searchable government department directory" },
  { title: "Bill Payment", file: "Bill_Payment.html", description: "Utility and service bill payment portal" },
  { title: "Payment Processing", file: "Payment_Processing.html", description: "Secure transaction feedback" },
  { title: "Payment Success", file: "Payment_Success.html", description: "Success confirmation and receipts" },
  { title: "File a Complaint", file: "File_Complaint.html", description: "Grievance filing and documentation" },
  { title: "Track Complaints", file: "Track_Complaints.html", description: "Monitor status of filed complaints" },
  { title: "Help & Assistance", file: "Help_Assistance.html", description: "Helpdesk and documentation portal" },
  { title: "Session Timeout", file: "Session_Timeout.html", description: "Kiosk security timeout layer" },
  { title: "PRD & Architecture", file: "PRD_Architecture.html", description: "Project structural planning" },
];

export default function DesignsPage() {
  const { fontScale } = useAppStore();

  return (
    <div className="min-h-screen bg-[#231a0f] text-slate-100 p-8 font-['Inter']">
      <header className="max-w-6xl mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 mb-6">
          <LayoutGrid className="text-[#ff8c00]" size={18} />
          <span className="text-[#ff8c00] text-sm font-bold tracking-widest uppercase">Stitch Design Library</span>
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-4" style={{ fontSize: 64 * fontScale }}>
          Premium <span className="text-[#ff8c00]">Suvidha One</span> UI
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto" style={{ fontSize: 20 * fontScale }}>
          The complete high-fidelity design system for the Unified Citizen Service Kiosk.
          Select a screen below to view the design in full fidelity.
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DESIGNS.map((design, index) => (
          <div 
            key={index}
            className="group relative bg-[#2a1f11] border border-white/5 rounded-3xl p-8 hover:border-[#ff8c00]/30 transition-all hover:shadow-[0_20px_50px_rgba(255,140,0,0.1)] overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/5 rounded-2xl">
                <FileCode className="text-[#ff8c00]" size={24} />
              </div>
              <div className="bg-[#ff8c00]/20 px-3 py-1 rounded-full border border-[#ff8c00]/30">
                <CheckCircle className="text-[#ff8c00]" size={14} />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-[#ff8c00] transition-colors">{design.title}</h3>
            <p className="text-slate-400 mb-8 line-clamp-2">{design.description}</p>
            
            <a 
              href={`/designs/${design.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-[#ff8c00] text-white font-bold rounded-2xl transition-all group-hover:bg-[#ff8c00]"
            >
              <span>View Full Design</span>
              <ExternalLink size={18} />
            </a>
            
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#ff8c00] opacity-0 blur-3xl group-hover:opacity-10 transition-opacity"></div>
          </div>
        ))}
      </main>

      <footer className="max-w-6xl mx-auto mt-24 pt-8 border-t border-white/5 text-center text-slate-500 pb-12">
        <p>© 2026 SUVIDHA ONE • Unified Citizen Service Kiosk</p>
      </footer>
    </div>
  );
}
