import { NPSQuestion } from './NPSQuestion';


const monthlyNPSData = [
  { month: 'Jan', promoters: 35, neutrals: 40, detractors: 25, npsRatio: 10 },
  { month: 'Feb', promoters: 38, neutrals: 37, detractors: 25, npsRatio: 13 },
  { month: 'Mar', promoters: 40, neutrals: 35, detractors: 25, npsRatio: 15 },
  { month: 'Apr', promoters: 37, neutrals: 38, detractors: 25, npsRatio: 12 },
  { month: 'May', promoters: 35, neutrals: 40, detractors: 25, npsRatio: 10 },
  { month: 'Jun', promoters: 42, neutrals: 33, detractors: 25, npsRatio: 17 },
  { month: 'Jul', promoters: 45, neutrals: 30, detractors: 25, npsRatio: 20 },
  { month: 'Ago', promoters: 43, neutrals: 32, detractors: 25, npsRatio: 18 },
  { month: 'Sep', promoters: 40, neutrals: 35, detractors: 25, npsRatio: 15 },
  { month: 'Oct', promoters: 38, neutrals: 37, detractors: 25, npsRatio: 13 },
  { month: 'Nov', promoters: 41, neutrals: 34, detractors: 25, npsRatio: 16 },
  { month: 'Dec', promoters: 44, neutrals: 31, detractors: 25, npsRatio: 19 }
];

export function SmartVOCResults() {
  return (
    <div className="space-y-6">
      {/* El componente 2.4 ya se mostrará desde otro lugar */}
      <NPSQuestion monthlyData={monthlyNPSData} />
    </div>
  );
} 