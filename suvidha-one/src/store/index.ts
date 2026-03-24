import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, AuthMethod, User, Bill, Grievance, Certificate, Transaction } from "@/types";

interface AppState {
  // Navigation
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Authentication
  isAuthenticated: boolean;
  authMethod: AuthMethod | null;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (method: AuthMethod, user: User) => void;
  logout: () => void;

  // Accessibility
  fontScale: number;
  setFontScale: (scale: number) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;

  // Bills
  bills: Bill[];
  setBills: (bills: Bill[]) => void;
  selectedBills: string[];
  toggleBillSelection: (billId: string) => void;
  selectAllBills: () => void;
  clearSelectedBills: () => void;
  
  // Service filter for bills
  selectedService: string | null;
  setSelectedService: (service: string | null) => void;
  getFilteredBills: () => Bill[];

  // Grievances
  grievances: Grievance[];
  addGrievance: (grievance: Grievance) => void;

  // Certificates
  certificates: Certificate[];

  // Payment
  paymentMode: "upi" | "card" | "cash" | null;
  setPaymentMode: (mode: "upi" | "card" | "cash") => void;
  currentTransaction: { id: string; amount: number; status: string } | null;
  setCurrentTransaction: (tx: { id: string; amount: number; status: string } | null) => void;

  // Transaction History
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: "welcome",
      setCurrentScreen: (screen) => {
        try {
          set({ currentScreen: screen, error: null });
        } catch (err) {
          console.error("setCurrentScreen error:", err);
          set({ error: err instanceof Error ? err.message : "Failed to navigate" });
        }
      },

      // Language
      language: "hi",
      setLanguage: (lang) => {
        try {
          set({ language: lang });
        } catch (err) {
          console.error("setLanguage error:", err);
        }
      },

      // Authentication
      isAuthenticated: false,
      authMethod: null,
      user: null,
      setUser: (user) => {
        try {
          set({ user, isAuthenticated: !!user });
        } catch (err) {
          console.error("setUser error:", err);
        }
      },
      login: (method, user) => {
        try {
          set({
            isAuthenticated: true,
            authMethod: method,
            user,
            currentScreen: "dashboard",
            error: null
          });
        } catch (err) {
          console.error("login error:", err);
          set({ error: err instanceof Error ? err.message : "Login failed" });
        }
      },
      logout: () => {
        try {
          set({
            isAuthenticated: false,
            authMethod: null,
            user: null,
            currentScreen: "welcome",
            selectedBills: [],
            selectedService: null,
            error: null
          });
        } catch (err) {
          console.error("logout error:", err);
        }
      },

      // Accessibility
      fontScale: 1,
      setFontScale: (scale) => {
        try {
          set({ fontScale: scale });
        } catch (err) {
          console.error("setFontScale error:", err);
        }
      },
      highContrast: false,
      setHighContrast: (enabled) => {
        try {
          set({ highContrast: enabled });
        } catch (err) {
          console.error("setHighContrast error:", err);
        }
      },
      voiceEnabled: true,
      setVoiceEnabled: (enabled) => {
        try {
          set({ voiceEnabled: enabled });
        } catch (err) {
          console.error("setVoiceEnabled error:", err);
        }
      },

      // Bills - Mock data
      bills: [
        { id: "1", provider: "Tata Power", consumerNumber: "1234567890", amount: 1200, dueDate: "2026-03-15", period: "Feb 2026", status: "pending", utilityType: "electricity" },
        { id: "2", provider: "BSES Yamuna", consumerNumber: "9876543210", amount: 850, dueDate: "2026-03-20", period: "Jan-Feb 2026", status: "pending", utilityType: "electricity" },
        { id: "3", provider: "Delhi Jal Board", consumerNumber: "5555666677", amount: 450, dueDate: "2026-03-10", period: "Feb 2026", status: "pending", utilityType: "water" },
        { id: "4", provider: "Indraprastha Gas", consumerNumber: "8888999900", amount: 800, dueDate: "2026-03-25", period: "Feb 2026", status: "pending", utilityType: "gas" },
      ],
      setBills: (bills) => {
        try {
          set({ bills });
        } catch (err) {
          console.error("setBills error:", err);
        }
      },
      selectedBills: [],
      toggleBillSelection: (billId) => set((state) => {
        try {
          return {
            selectedBills: state.selectedBills.includes(billId)
              ? state.selectedBills.filter(id => id !== billId)
              : [...state.selectedBills, billId]
          };
        } catch (err) {
          console.error("toggleBillSelection error:", err);
          return state;
        }
      }),
      selectAllBills: () => set((state) => {
        try {
          const filteredBills = state.selectedService
            ? state.bills.filter(b => b.utilityType === state.selectedService && b.status === "pending")
            : state.bills.filter(b => b.status === "pending");
          return { selectedBills: filteredBills.map(b => b.id) };
        } catch (err) {
          console.error("selectAllBills error:", err);
          return state;
        }
      }),
      clearSelectedBills: () => {
        try {
          set({ selectedBills: [], selectedService: null });
        } catch (err) {
          console.error("clearSelectedBills error:", err);
        }
      },

      // Service filter
      selectedService: null,
      setSelectedService: (service) => {
        try {
          set({ selectedService: service, selectedBills: [] });
        } catch (err) {
          console.error("setSelectedService error:", err);
        }
      },
      getFilteredBills: () => {
        const state = get();
        if (!state.selectedService || state.selectedService === "bills") {
          return state.bills.filter(b => b.status === "pending");
        }
        return state.bills.filter(b => b.utilityType === state.selectedService && b.status === "pending");
      },

      // Grievances
      grievances: [],
      addGrievance: (grievance) => set((state) => {
        try {
          return { grievances: [...state.grievances, grievance] };
        } catch (err) {
          console.error("addGrievance error:", err);
          return state;
        }
      }),

      // Certificates
      certificates: [
        { id: "1", type: "Birth Certificate", typeHindi: "जन्म प्रमाण पत्र", status: "processing", applicationNumber: "APP2026001", createdAt: "2026-02-15" },
      ],

      // Payment
      paymentMode: null,
      setPaymentMode: (mode) => {
        try {
          set({ paymentMode: mode });
        } catch (err) {
          console.error("setPaymentMode error:", err);
        }
      },
      currentTransaction: null,
      setCurrentTransaction: (tx) => {
        try {
          set({ currentTransaction: tx });
          // Add to transaction history when transaction is set
          if (tx) {
            const newTransaction: Transaction = {
              id: tx.id,
              amount: tx.amount,
              status: tx.status as "pending" | "success" | "failed",
              type: "Bill Payment",
              date: new Date().toISOString()
            };
            const currentTransactions = get().transactions;
            set({ transactions: [newTransaction, ...currentTransactions] });
          }
        } catch (err) {
          console.error("setCurrentTransaction error:", err);
        }
      },

      // Transaction History
      transactions: [],
      addTransaction: (transaction) => set((state) => {
        try {
          return { transactions: [transaction, ...state.transactions] };
        } catch (err) {
          console.error("addTransaction error:", err);
          return state;
        }
      }),
      clearTransactions: () => {
        try {
          set({ transactions: [] });
        } catch (err) {
          console.error("clearTransactions error:", err);
        }
      },

      // Error handling
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "suvidha-one-storage",
      partialize: (state) => ({
        language: state.language,
        fontScale: state.fontScale,
        highContrast: state.highContrast,
        voiceEnabled: state.voiceEnabled,
        transactions: state.transactions,
      }),
    }
  )
);
