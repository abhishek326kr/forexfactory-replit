import DownloadCard from '../DownloadCard';
import mt4Image from '@assets/generated_images/MT4_EA_screenshot_01fda502.png';

export default function DownloadCardExample() {
  const mockDownload = {
    id: '1',
    name: 'Gold Scalper Pro EA',
    description: 'Advanced scalping Expert Advisor optimized for XAUUSD with built-in risk management and news filter.',
    version: '2.5.1',
    compatibility: ['MT4', 'MT5'] as ('MT4' | 'MT5')[],
    downloads: 45230,
    rating: 4.8,
    lastUpdated: '2 days ago',
    image: mt4Image,
    fileSize: '2.3 MB',
    isPremium: false,
    features: [
      'Auto lot sizing',
      'News filter included',
      'Works on all timeframes',
      'Built-in money management',
    ],
  };

  return (
    <div className="max-w-md">
      <DownloadCard {...mockDownload} />
    </div>
  );
}