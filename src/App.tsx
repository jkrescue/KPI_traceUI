import { useState } from "react";
import { SteeringKPIFlow } from "./components/SteeringKPIFlow";
import { TradeoffAnalysis } from "./components/TradeoffAnalysis";
import { DesignScheme } from "./data/tradeoffData";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'tradeoff' | 'evaluation'>('tradeoff');
  const [selectedScheme, setSelectedScheme] = useState<DesignScheme | null>(null);

  const handleProceedToEvaluation = (scheme: DesignScheme) => {
    setSelectedScheme(scheme);
    setCurrentPage('evaluation');
  };

  const handleBackToTradeoff = () => {
    setCurrentPage('tradeoff');
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {currentPage === 'tradeoff' ? (
        <TradeoffAnalysis onProceedToEvaluation={handleProceedToEvaluation} />
      ) : (
        <SteeringKPIFlow selectedScheme={selectedScheme} onBackToTradeoff={handleBackToTradeoff} />
      )}
    </div>
  );
}