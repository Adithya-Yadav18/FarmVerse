// ─── User & Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'Admin' | 'Farmer' | 'Agronomist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

// ─── Farm ─────────────────────────────────────────────────────────────────────
export interface Farm {
  id: string;
  name: string;
  location: string;
  area: number; // hectares
  areaUnit: 'hectares' | 'acres';
  soilType: string;
  status: 'Active' | 'Inactive' | 'Harvested';
  ownerId: string;
  crops: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Crop ─────────────────────────────────────────────────────────────────────
export type CropStatus = 'Planted' | 'Growing' | 'Flowering' | 'Harvested' | 'Failed';

export interface Crop {
  id: string;
  name: string;
  variety: string;
  farmId: string;
  farmName: string;
  plantedDate: string;
  expectedHarvestDate: string;
  status: CropStatus;
  area: number;
  yield?: number;
  notes?: string;
  createdAt: string;
}

// ─── Soil Analysis ────────────────────────────────────────────────────────────
export interface SoilAnalysis {
  id: string;
  farmId: string;
  farmName: string;
  sampleDate: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  moisture: number;
  recommendation: string;
  status: 'Optimal' | 'Needs Attention' | 'Critical';
}

// ─── Weather ──────────────────────────────────────────────────────────────────
export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  icon: string;
  updatedAt: string;
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

// ─── Irrigation ───────────────────────────────────────────────────────────────
export type IrrigationStatus = 'Active' | 'Scheduled' | 'Completed' | 'Paused';

export interface IrrigationSchedule {
  id: string;
  farmId: string;
  farmName: string;
  zone: string;
  startTime: string;
  duration: number; // minutes
  waterVolume: number; // liters
  status: IrrigationStatus;
  method: 'Drip' | 'Sprinkler' | 'Flood' | 'Center Pivot';
  automated: boolean;
  nextRun?: string;
}

// ─── Disease Detection ────────────────────────────────────────────────────────
export interface DiseaseDetection {
  id: string;
  cropId: string;
  cropName: string;
  farmId: string;
  detectedAt: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedArea: number;
  treatment: string;
  status: 'Detected' | 'Treating' | 'Resolved';
  imageUrl?: string;
}

// ─── AI Recommendations ───────────────────────────────────────────────────────
export interface CropRecommendation {
  id: string;
  farmId: string;
  cropName: string;
  suitabilityScore: number;
  expectedYield: number;
  estimatedRevenue: number;
  waterRequirement: string;
  soilRequirement: string;
  season: string;
  reasons: string[];
  risks: string[];
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationSeverity;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  title: string;
  type: 'Yield' | 'Soil' | 'Water' | 'Financial' | 'Pest';
  period: string;
  generatedAt: string;
  status: 'Ready' | 'Generating' | 'Failed';
  fileUrl?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalFarms: number;
  activeCrops: number;
  pendingAlerts: number;
  waterUsage: number;
  yieldForecast: number;
  soilHealth: number;
}

// ─── Generic API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Table & UI ───────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface FilterState {
  search: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
