/**
 * NavigationFlow types
 */

export interface NavigationFlowResultsProps {
  researchId: string;
  data?: NavigationFlowData;
}

export interface NavigationFlowData {
  metrics: NavigationMetrics;
  heatmapAreas: HeatmapArea[];
  clickData: ClickData[];
}

export interface NavigationMetrics {
  totalClicks: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

export interface HeatmapArea {
  id: string;
  x: number;
  y: number;
  intensity: number;
}

export interface ClickData {
  x: number;
  y: number;
  timestamp: number;
}

export interface AOI {
  id: string;
  name: string;
  coordinates: ConvertedHitZone;
}

export interface ConvertedHitZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFile {
  id: string;
  url: string;
  name: string;
}