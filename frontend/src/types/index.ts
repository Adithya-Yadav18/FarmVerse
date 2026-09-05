// ─── User & Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'Admin' | 'Farmer' | 'Agronomist' | 'Normal User';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  region?: string;
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
  location?: string;
  phoneNumber?: string;
  adminPasscode?: string;
  specialization?: string;
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

// ─── Disease Detection & Tracking ─────────────────────────────────────────────
export type ContainmentStatus = 'CONTAINED' | 'SPREADING' | 'QUARANTINED' | 'ERADICATED';
export type RecoveryStage = 'ACTIVE_INFECTION' | 'UNDER_TREATMENT' | 'SIGNIFICANT_RECOVERY' | 'RESOLVED_HEALTHY';
export type TreatmentType = 'CHEMICAL_FUNGICIDE' | 'ORGANIC_BIOCONTROL' | 'CULTURAL_PRUNING' | 'NUTRITIONAL_BOOST';

export interface DiseaseDetection {
  id: string;
  cropId?: string;
  cropName: string;
  farmId: string;
  farmName?: string;
  farmerName?: string;
  detectedAt: string;
  disease: string;
  pathogenType?: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedArea: number;
  treatment: string;
  status: 'Detected' | 'Treating' | 'Resolved';
  imageUrl?: string;
  containmentStatus?: ContainmentStatus;
  recoveryStage?: RecoveryStage;
  currentRecoveryPercentage?: number;
  totalTreatmentCostInr?: number;
  latestFollowUpImageUrl?: string;
  agronomistVerified?: boolean;
  agronomistNotes?: string;
  agronomistPrescription?: string;
  verifiedByAgronomistName?: string;
  updatedAt?: string;
}

export interface DiseaseTreatmentLog {
  id: string;
  detectionId: string;
  treatmentDate: string;
  treatmentName: string;
  treatmentType: TreatmentType;
  dosage?: string;
  costInr?: number;
  recoveryPercentage: number;
  followUpImageUrl?: string;
  notes?: string;
  appliedBy?: string;
  createdAt?: string;
}

export interface DiseaseTrackingSummary {
  totalCases: number;
  activeInfections: number;
  underTreatment: number;
  resolvedCases: number;
  quarantinedPlots: number;
  averageRecoveryDays: number;
  totalTreatmentSpendingInr: number;
  containmentSuccessRate: number;
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
export type NotificationCategory = 'DISEASE' | 'SOIL' | 'WEATHER' | 'IRRIGATION' | 'PRESCRIPTION' | 'SYSTEM';

export interface Notification {
  id: string;
  userId?: string | number;
  title: string;
  message: string;
  type: NotificationSeverity;
  category?: NotificationCategory;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export type ReportType =
  | 'AGRONOMY_COMPREHENSIVE'
  | 'SOIL_NUTRIENT'
  | 'DISEASE_SURVEILLANCE'
  | 'IRRIGATION_EFFICIENCY'
  | 'CROP_CYCLE_SUMMARY';

export interface Report {
  id: string | number;
  reportTitle?: string;
  title?: string;
  reportType?: ReportType | string;
  type?: 'Yield' | 'Soil' | 'Water' | 'Financial' | 'Pest' | string;
  dateRange?: string;
  period?: string;
  format?: string;
  fileSize?: string;
  size?: string;
  status: 'Ready' | 'Generating' | 'Failed' | 'READY' | 'GENERATING' | 'FAILED' | string;
  summary?: string;
  downloadCount?: number;
  generatedAt: string;
  farmName?: string;
  generatedByName?: string;
  fileUrl?: string;
}

export interface GenerateReportRequest {
  farmId?: number | string;
  reportType: string;
  dateRange?: string;
  notes?: string;
}

export interface ReportStats {
  totalReports: number;
  comprehensiveCount: number;
  soilCount: number;
  diseaseCount: number;
  irrigationCount: number;
  totalDownloads: number;
}

// ─── Satellite NDVI & Multispectral ───────────────────────────────────────────
export interface NdviGridCell {
  row: number;
  col: number;
  quadrantName: string;
  ndvi: number;
  ndwi: number;
  chlorophyll: number;
  status: 'Optimal' | 'Healthy' | 'Stress' | 'Critical' | string;
  color: string;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  recommendation?: string;
}

export interface SatelliteNdviRecord {
  id: number;
  farmId: number;
  farmName: string;
  farmLocation: string;
  centerLat: number;
  centerLng: number;
  captureDate: string;
  satelliteSource: string;
  cloudCoveragePercent: number;
  meanNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  ndwiMoistureIndex: number;
  chlorophyllIndex: number;
  canopyVigourRating: 'Excellent' | 'Healthy' | 'Moderate Stress' | 'Severe Stress' | string;
  anomalyDetected: boolean;
  anomalyDetails?: string;
  gridCells: NdviGridCell[];
  farmBounds?: [[number, number], [number, number]];
}

export interface NdviHistoricalPoint {
  date: string;
  meanNdvi: number;
  ndwi: number;
  vigourScore: number;
  passLabel: string;
}

export interface SatelliteOverviewStats {
  totalFarmsMonitored: number;
  averageCanopyNdvi: number;
  activeAnomaliesCount: number;
  highVigourPercentage: number;
  satellitePassCadenceDays: number;
  lastSatellitePass: string;
  satelliteConstellation: string;
}

export interface PublicCanopyBadge {
  farmName: string;
  location: string;
  primaryCrop: string;
  canopyVigourRating: string;
  meanNdvi: number;
  certifiedSustainable: boolean;
  verificationHash: string;
  verifiedDate: string;
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
