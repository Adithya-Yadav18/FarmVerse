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

// ─── Module 13: e-NAM Mandi Prices & Price Arbitrage ─────────────────────────
export interface MandiPrice {
  id: number;
  commodity: string;
  variety: string;
  category: string;
  mandiName: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  mspPrice: number | null;
  mspSpread: number;
  priceChangePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  arrivalsTonnes: number;
  distanceKm: number | null;
  recordedDate: string;
}

export interface ArbitrageRequest {
  farmId: number;
  commodity: string;
  quantityQuintals: number;
}

export interface ArbitrageOption {
  mandiName: string;
  district: string;
  state: string;
  distanceKm: number;
  modalPrice: number;
  transportCostPerQuintal: number;
  grossRevenue: number;
  totalTransportCost: number;
  netProfit: number;
  netPricePerQuintal: number;
  isRecommended: boolean;
  recommendationReason?: string;
}

export interface ArbitrageResponse {
  farmName: string;
  farmLocation: string;
  commodity: string;
  quantityQuintals: number;
  localMandiName: string;
  localNetProfit: number;
  recommendedMandiName: string;
  recommendedNetProfit: number;
  additionalProfit: number;
  percentageGain: number;
  mandiOptions: ArbitrageOption[];
}

export interface CommodityPriceHistory {
  date: string;
  modalPrice: number;
  mspPrice: number;
  volumeTonnes: number;
}

export interface MarketSummaryStats {
  totalMandisCovered: number;
  totalCommoditiesTracked: number;
  topGainers: MandiPrice[];
  topLosers: MandiPrice[];
  avgModalPrice: number;
  marketSentiment: string;
  lastSyncedAt: string;
}

// ─── Farm-to-Fork QR Traceability (Module 14) ──────────────────────────────────
export interface ProduceBatch {
  id: number;
  batchCode: string;
  farmId: number;
  farmName: string;
  farmLocation: string;
  latitude?: number;
  longitude?: number;
  farmerName: string;
  commodity: string;
  variety?: string;
  quantityKg: number;
  sowingDate?: string;
  harvestDate: string;
  packagingDate?: string;
  expiryDate?: string;
  farmingPractice: string;
  soilType?: string;
  waterSource?: string;
  satelliteVigourRating?: string;
  diseaseStatus?: string;
  agronomistCertified: boolean;
  agronomistName?: string;
  agronomistNotes?: string;
  certificationSeal?: string;
  status: 'ACTIVE' | 'IN_TRANSIT' | 'DELIVERED' | 'RECALLED';
  qrDataUrl: string;
  cryptographicHash: string;
  scanCount: number;
  avgRating?: number;
  totalReviews?: number;
  createdAt: string;
}

export interface FarmOrigin {
  farmId: number;
  farmName: string;
  location: string;
  latitude: number;
  longitude: number;
  farmerName: string;
  region: string;
  farmingExperienceYears: number;
  soilType: string;
}

export interface CultivationInfo {
  sowingDate?: string;
  harvestDate: string;
  growthDurationDays: number;
  waterSource: string;
  farmingPractice: string;
  weatherSummary: string;
}

export interface QualityAudit {
  satelliteVigourRating: string;
  meanNdvi: number;
  diseaseStatus: string;
  labVerificationStatus: string;
}

export interface AgronomistEndorsement {
  certified: boolean;
  agronomistName: string;
  certificationSeal?: string;
  notes?: string;
  certifiedAtDate: string;
}

export interface ProduceReview {
  id: number;
  consumerName: string;
  rating: number;
  reviewText: string;
  consumerLocation: string;
  createdAtFormatted: string;
}

export interface PublicProduceJourney {
  batchCode: string;
  commodity: string;
  variety?: string;
  quantityKg: number;
  status: string;
  farmingPractice: string;
  harvestDate: string;
  packagingDate?: string;
  expiryDate?: string;
  qrDataUrl: string;
  cryptographicHash: string;
  scanCount: number;
  origin: FarmOrigin;
  cultivation: CultivationInfo;
  qualityAudit: QualityAudit;
  endorsement: AgronomistEndorsement;
  avgRating: number;
  totalReviews: number;
  reviews: ProduceReview[];
}

export interface CreateBatchPayload {
  farmId: number;
  commodity: string;
  variety?: string;
  quantityKg: number;
  sowingDate?: string;
  harvestDate?: string;
  packagingDate?: string;
  expiryDate?: string;
  farmingPractice?: string;
  soilType?: string;
  waterSource?: string;
  certificationSeal?: string;
}

export interface CertifyBatchPayload {
  agronomistName: string;
  agronomistNotes: string;
  certificationSeal: string;
  approved: boolean;
}

export interface TraceabilitySummaryStats {
  totalBatches: number;
  totalScans: number;
  certifiedOrganicPercent: number;
  activeRecalls: number;
  certifiedBatches: number;
}

// ─── Module 15: FarmVerse Credit Scoring & Micro-Loan Underwriting ─────────
export interface CreditPillarDetail {
  key: string;
  name: string;
  score: number;
  weight: number;
  grade: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  telemetryMetric: string;
  impactNotes: string;
}

export interface CreditScoreResponse {
  id: number;
  farmerId: number;
  farmerName: string;
  farmId: number;
  farmName: string;
  farmLocation: string;
  score: number; // 300 - 900
  tier: 'PRIME_A' | 'SUPERIOR_B' | 'STANDARD_C' | 'HIGH_RISK_D';
  tierLabel: string;
  maxPreApprovedLimit: number;
  kccEligible: boolean;
  agronomistEndorsed: boolean;
  agronomistName?: string;
  agronomistNotes?: string;
  soilHealthScore: number;
  satelliteNdviScore: number;
  harvestTraceabilityScore: number;
  waterResilienceScore: number;
  pillars: CreditPillarDetail[];
  recommendations: string[];
  calculatedAt: string;
}

export interface LoanOffer {
  id: string;
  title: string;
  category: string;
  description: string;
  maxAmount: number;
  interestRateAnnual: number;
  kccSubsidized: boolean;
  tenureRange: string;
  keyBenefits: string[];
}

export interface LoanApplication {
  id: number;
  applicationNumber: string;
  farmerId: number;
  farmerName: string;
  farmId: number;
  farmName: string;
  farmLocation: string;
  loanType: string;
  amountRequested: number;
  tenureMonths: number;
  interestRate: number;
  monthlyEmi: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  creditScoreAtApplication: number;
  reviewedBy?: string;
  underwritingNotes?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface ApplyLoanPayload {
  farmId: number;
  loanType: string;
  amountRequested: number;
  tenureMonths: number;
  purpose: string;
}

export interface ReviewLoanPayload {
  status: 'APPROVED' | 'DISBURSED' | 'REJECTED';
  underwritingNotes: string;
}

export interface SahayakRequestPayload {
  farmerName: string;
  phoneNumber: string;
  village: string;
  assistanceType: 'DOORSTEP_VISIT' | 'PHONE_CALLBACK';
  preferredLanguage: string;
  notes: string;
}

export interface SahayakResponse {
  ticketNumber: string;
  assignedOfficer: string;
  officerPhone: string;
  villageKendra: string;
  status: string;
  expectedVisitTime: string;
  message: string;
}

export interface KendraCenter {
  name: string;
  type: string;
  address: string;
  contactPerson: string;
  phone: string;
  distanceKm: string;
  services: string;
}

// ─── Module 16: Generative Crop Simulator ──────────────────────────────────
export interface CropSimulationRequest {
  farmId: number;
  cropId?: number;
  cropName: string;
  scenarioName: string;
  waterAdjustmentPercent: number; // -50 to +50
  fertilizerAdjustmentPercent: number; // 0 to 200
  temperatureOffset: number; // -3.0 to +5.0
  sowingShiftDays: number; // -15 to +30
  pestPressure: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  irrigationMethod: 'FLOOD' | 'DRIP' | 'SPRINKLER' | 'MULCH_DRIP';
}

export interface SimulationWeeklyPoint {
  week: number;
  stageName: string;
  baselineBiomass: number;
  simulatedBiomass: number;
  simulatedNdvi: number;
}

export interface CropSimulationResult {
  id?: number;
  farmId: number;
  farmName: string;
  cropName: string;
  scenarioName: string;
  baselineYieldQuintals: number;
  projectedYieldQuintals: number;
  yieldChangePercent: number;
  mandiPricePerQuintal: number;
  inputCostPerAcre: number;
  grossRevenuePerAcre: number;
  netProfitPerAcre: number;
  baselineNetProfitPerAcre: number;
  profitChangePercent: number;
  resilienceIndex: number;
  riskLevel: 'LOW' | 'MODERATE' | 'SEVERE';
  waterConsumptionLitersPerAcre: number;
  waterEfficiencyLitersPerKg: number;
  irrigationMethod: string;
  weeklyGrowthCurve: SimulationWeeklyPoint[];
  actionableAdvice: string[];
  riskWarnings: string[];
  createdAt: string;
}

export interface SavedScenarioSummary {
  id: number;
  farmId: number;
  scenarioName: string;
  cropName: string;
  projectedYieldQuintals: number;
  yieldChangePercent: number;
  netProfitPerAcre: number;
  resilienceIndex: number;
  riskLevel: 'LOW' | 'MODERATE' | 'SEVERE';
  irrigationMethod: string;
  createdAt: string;
}

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  icon: string;
  waterAdjustmentPercent: number;
  fertilizerAdjustmentPercent: number;
  temperatureOffset: number;
  sowingShiftDays: number;
  pestPressure: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  irrigationMethod: 'FLOOD' | 'DRIP' | 'SPRINKLER' | 'MULCH_DRIP';
}

// ─── Module 17: Carbon Footprint Tracker & Green Carbon Credits ─────────────
export interface CarbonAuditRequest {
  farmId: number;
  dieselUsageLiters: number;
  syntheticFertilizerKg: number;
  electricityKwh: number;
  tillageMethod: 'CONVENTIONAL' | 'REDUCED' | 'NO_TILL';
  stubbleBurningAvoided: boolean;
  solarPumpInstalled: boolean;
  dripIrrigationActive: boolean;
  biocharCompostTons: number;
  agroforestryTreesCount: number;
  coverCroppingAcres: number;
}

export interface EmissionItem {
  sourceName: string;
  amountKgCo2: number;
  percentOfTotal: number;
  icon: string;
  mitigationTip: string;
}

export interface SequestrationItem {
  practiceName: string;
  amountKgCo2: number;
  percentOfTotal: number;
  icon: string;
  permanenceYears: string;
}

export interface CarbonAuditResult {
  id?: number;
  farmId: number;
  farmName: string;
  farmLocation: string;
  periodYear: number;
  totalEmissionsKgCo2: number;
  totalSequestrationKgCo2: number;
  netCarbonKgCo2: number;
  netCarbonTonnesCo2: number;
  isNetNegative: boolean;
  carbonCreditsMinted: number;
  carbonRating: 'NET_NEGATIVE_A_PLUS' | 'LOW_CARBON_A' | 'BALANCED_B' | 'CARBON_INTENSIVE_C' | string;
  estimatedMonetizationInr: number;
  certificateSerial: string;
  emissionsBreakdown: EmissionItem[];
  sequestrationBreakdown: SequestrationItem[];
  actionableRecommendations: string[];
  createdAt: string;
}

export interface CarbonCreditListing {
  id: number;
  farmId: number;
  farmName: string;
  farmerName: string;
  location: string;
  creditsAvailable: number;
  pricePerCreditInr: number;
  totalPriceInr: number;
  certificateSerial: string;
  status: 'ACTIVE' | 'SOLD' | 'RETIRED';
  carbonRating: string;
  createdAt: string;
}

export interface ListCreditsPayload {
  farmId: number;
  creditsToList: number;
  pricePerCreditInr: number;
}

export interface BuyCreditPayload {
  creditsToBuy: number;
  buyerName: string;
  buyerEmail: string;
  buyerOrganization: string;
}

export interface CertificateReceipt {
  certificateSerial: string;
  farmName: string;
  farmerName: string;
  location: string;
  creditsRetired: number;
  co2OffsetTonnes: number;
  buyerName: string;
  buyerOrganization: string;
  issuedAt: string;
  verificationHash: string;
}

// ==========================================
// Module 18: Farm Equipment & CHC Marketplace Types
// ==========================================

export type EquipmentCategory =
  | 'ALL'
  | 'TRACTOR'
  | 'COMBINE_HARVESTER'
  | 'DRONE_SPRAYER'
  | 'ROTAVATOR'
  | 'LASER_LEVELER'
  | 'WATER_PUMP'
  | 'BALER'
  | 'SEED_DRILL';

export interface EquipmentItem {
  id: number;
  name: string;
  category: EquipmentCategory | string;
  brand: string;
  horsepower: number;
  fuelType: 'DIESEL' | 'ELECTRIC' | 'SOLAR' | 'PETROL' | string;
  hourlyRate: number;
  dailyRate: number;
  securityDeposit: number;
  operatorIncluded: boolean;
  conditionStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | string;
  locationName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  ownerName: string;
  ownerPhone: string;
  ownerId?: number;
  imageUrl: string;
  description: string;
  specsJson?: string;
  rating: number;
  totalRentalsCount: number;
  createdAt: string;
}

export interface EquipmentBooking {
  id: number;
  bookingReference: string;
  equipmentId: number;
  equipmentName: string;
  equipmentCategory: string;
  equipmentBrand: string;
  equipmentImageUrl: string;
  equipmentLocation: string;
  renterId?: number;
  renterName: string;
  renterPhone: string;
  deliveryAddress: string;
  startDate: string;
  endDate: string;
  durationUnits: number;
  rentalType: 'DAILY' | 'HOURLY';
  totalRentalAmount: number;
  securityDeposit: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  withOperator: boolean;
  deliveryRequired: boolean;
  specialInstructions?: string;
  bookedAt: string;
  reviewedAt?: string;
  ownerNotes?: string;
  ownerName: string;
  ownerPhone: string;
}

export interface CreateBookingPayload {
  equipmentId: number;
  renterName: string;
  renterPhone: string;
  deliveryAddress: string;
  startDate: string;
  endDate: string;
  durationUnits: number;
  rentalType: 'DAILY' | 'HOURLY';
  withOperator: boolean;
  deliveryRequired: boolean;
  specialInstructions?: string;
}

export interface CreateEquipmentPayload {
  name: string;
  category: string;
  brand: string;
  horsepower: number;
  fuelType: string;
  hourlyRate: number;
  dailyRate: number;
  securityDeposit: number;
  operatorIncluded: boolean;
  conditionStatus: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  ownerName: string;
  ownerPhone: string;
  imageUrl?: string;
  description: string;
  specsJson?: string;
}

// ==========================================
// Module 19: Multi-lingual Voice Assistant Types
// ==========================================

export type SupportedLanguageCode = 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'en';

export interface VoiceLanguage {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
  speechLocale: string;
  flag: string;
}

export interface VoiceQueryPayload {
  queryText: string;
  languageCode: SupportedLanguageCode | string;
  farmId?: number;
  cropContext?: string;
  category?: string;
}

export interface VoiceAdvisoryResult {
  consultationId: number;
  transcribedQuery: string;
  detectedLanguage: string;
  languageCode: string;
  spokenResponse: string;
  writtenAdvisory: string;
  actionItems: string[];
  suggestedNextQuestions: string[];
  category: string;
  createdAt: string;
}

export interface VoicePreset {
  id: string;
  languageCode: string;
  category: string;
  promptText: string;
  englishMeaning: string;
  icon: string;
}

export interface VoiceConsultationHistoryItem {
  id: number;
  languageCode: string;
  transcribedQuery: string;
  spokenResponse: string;
  writtenAdvisory: string;
  category: string;
  isBookmarked: boolean;
  createdAt: string;
}

// ==========================================
// Module 20: SOS Crop Rescue API Types
// ==========================================

export type EmergencyType =
  | 'CHEMICAL_BURN_TOXICITY'
  | 'FLOOD_WATERLOGGING'
  | 'PEST_SWARM_ATTACK'
  | 'HAILSTORM_PHYSICAL_DAMAGE'
  | 'SEVERE_DROUGHT_WILT';

export type EmergencySeverity = 'CRITICAL_IMMEDIATE' | 'HIGH_24H' | 'MODERATE';

export type RescueStatus =
  | 'SOS_TRIGGERED'
  | 'ANTIDOTE_DEPLOYED'
  | 'AGRONOMIST_DISPATCHED'
  | 'STABILIZED'
  | 'RESOLVED';

export interface FirstAidStep {
  stepNumber: number;
  title: string;
  actionInstruction: string;
  timingUrgency: string;
  caution: string;
}

export interface PmfbyClaimDossier {
  claimReference: string;
  farmerName: string;
  farmLocation: string;
  gpsLatitude: number;
  gpsLongitude: number;
  affectedCrop: string;
  claimedAcreage: number;
  disasterEvent: string;
  incidentTimestamp: string;
  estimatedLossPercent: number;
  estimatedPayoutInr: number;
  claimStatus: string;
}

export interface RescueTicket {
  id: number;
  ticketCode: string;
  farmId?: number;
  farmName: string;
  farmerName: string;
  farmerPhone: string;
  latitude: number;
  longitude: number;
  emergencyType: EmergencyType | string;
  severityLevel: EmergencySeverity | string;
  affectedAcres: number;
  cropName: string;
  cropGrowthStage: string;
  symptomsDescription?: string;
  firstAidProtocol: FirstAidStep[];
  assignedAgronomistName: string;
  assignedAgronomistPhone: string;
  status: RescueStatus | string;
  estimatedDamagePercent: number;
  estimatedSalvagePercent: number;
  pmfbyDossier?: PmfbyClaimDossier;
  resolutionNotes?: string;
  triggeredAt: string;
  resolvedAt?: string;
}

export interface TriggerSosPayload {
  farmId?: number;
  cropName: string;
  emergencyType: EmergencyType | string;
  severityLevel: EmergencySeverity | string;
  affectedAcres: number;
  cropGrowthStage?: string;
  symptomsDescription?: string;
  farmerName?: string;
  farmerPhone?: string;
  latitude?: number;
  longitude?: number;
}

export interface EmergencyCategoryPreset {
  type: EmergencyType | string;
  label: string;
  icon: string;
  defaultSeverity: string;
  typicalSymptoms: string;
  quickAntidoteSummary: string;
}

// ==========================================
// Module 21: Admin User Management API Types
// ==========================================

export interface AdminUserSummary {
  id: number;
  fullName: string;
  email: string;
  role: string;
  normalizedRole: UserRole | string;
  phoneNumber: string;
  location: string;
  status: 'ACTIVE' | 'SUSPENDED';
  totalFarmsCount: number;
  totalCropsCount: number;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalFarmers: number;
  totalAgronomists: number;
  totalAdmins: number;
  totalNormalUsers: number;
  totalFarms: number;
  totalAcreage: number;
  totalCropsPlanted: number;
  totalEquipmentListings: number;
  totalActiveRescues: number;
  totalCarbonCreditsTraded: number;
  roleDistribution: Record<string, number>;
}

export interface UpdateUserRolePayload {
  role: string;
}

export interface UpdateUserStatusPayload {
  status: 'ACTIVE' | 'SUSPENDED';
  reason?: string;
}

export interface CreateUserByAdminPayload {
  fullName: string;
  email: string;
  password?: string;
  role: string;
  phoneNumber?: string;
  location?: string;
  status?: string;
}






