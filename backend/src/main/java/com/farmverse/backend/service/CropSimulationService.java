package com.farmverse.backend.service;

import com.farmverse.backend.dto.CropSimulationDTO;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.entity.CropSimulationEntity;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.CropRepository;
import com.farmverse.backend.repository.CropSimulationRepository;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CropSimulationService {

    private final CropSimulationRepository simulationRepository;
    private final FarmRepository farmRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // Agronomic Crop Benchmark Registry (Yield in Quintals/Acre, Mandi Price ₹/Quintal, Water L/Acre, Cost ₹/Acre)
    private static final Map<String, CropBenchmark> BENCHMARKS = new HashMap<>();

    static {
        BENCHMARKS.put("wheat", new CropBenchmark("Wheat", 18.5, 2425.0, 3500000.0, 14500.0, 1.15));
        BENCHMARKS.put("rice", new CropBenchmark("Rice (Paddy)", 24.0, 2320.0, 6800000.0, 17200.0, 1.20));
        BENCHMARKS.put("paddy", new CropBenchmark("Rice (Paddy)", 24.0, 2320.0, 6800000.0, 17200.0, 1.20));
        BENCHMARKS.put("cotton", new CropBenchmark("Cotton", 9.5, 7150.0, 4200000.0, 22000.0, 0.85));
        BENCHMARKS.put("tomato", new CropBenchmark("Tomato", 120.0, 1850.0, 3800000.0, 35000.0, 1.05));
        BENCHMARKS.put("maize", new CropBenchmark("Maize", 28.0, 2150.0, 3200000.0, 12800.0, 1.25));
        BENCHMARKS.put("corn", new CropBenchmark("Maize", 28.0, 2150.0, 3200000.0, 12800.0, 1.25));
        BENCHMARKS.put("sugarcane", new CropBenchmark("Sugarcane", 350.0, 340.0, 12000000.0, 38000.0, 1.20));
        BENCHMARKS.put("soybean", new CropBenchmark("Soybean", 11.0, 4650.0, 2800000.0, 11500.0, 0.85));
        BENCHMARKS.put("potato", new CropBenchmark("Potato", 95.0, 1450.0, 3100000.0, 28000.0, 1.10));
        BENCHMARKS.put("onion", new CropBenchmark("Onion", 85.0, 1950.0, 3400000.0, 24000.0, 1.10));
        BENCHMARKS.put("groundnut", new CropBenchmark("Groundnut", 10.5, 6200.0, 2900000.0, 16000.0, 0.70));
    }

    private static class CropBenchmark {
        String displayName;
        double baselineYield; // Quintals / acre
        double mandiPrice;    // ₹ / quintal
        double waterRequirement; // Liters / acre
        double baselineCost;  // ₹ / acre
        double kySensitivity; // FAO-56 yield response factor

        CropBenchmark(String displayName, double baselineYield, double mandiPrice, double waterRequirement, double baselineCost, double kySensitivity) {
            this.displayName = displayName;
            this.baselineYield = baselineYield;
            this.mandiPrice = mandiPrice;
            this.waterRequirement = waterRequirement;
            this.baselineCost = baselineCost;
            this.kySensitivity = kySensitivity;
        }
    }

    public CropSimulationService(
            CropSimulationRepository simulationRepository,
            FarmRepository farmRepository,
            CropRepository cropRepository,
            UserRepository userRepository
    ) {
        this.simulationRepository = simulationRepository;
        this.farmRepository = farmRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    public CropSimulationDTO.SimulationResultResponse calculateSimulation(
            CropSimulationDTO.SimulationRunRequest req,
            String userEmail
    ) {
        Farm farm = resolveFarmWithPermission(req.getFarmId(), userEmail);
        return runSimulationMath(req, farm, null);
    }

    @Transactional
    public CropSimulationDTO.SimulationResultResponse saveSimulation(
            CropSimulationDTO.SimulationRunRequest req,
            String userEmail
    ) {
        Farm farm = resolveFarmWithPermission(req.getFarmId(), userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Crop crop = null;
        if (req.getCropId() != null) {
            crop = cropRepository.findById(req.getCropId()).orElse(null);
        }

        CropSimulationDTO.SimulationResultResponse result = runSimulationMath(req, farm, crop);

        String curveJson = "[]";
        try {
            curveJson = objectMapper.writeValueAsString(result.getWeeklyGrowthCurve());
        } catch (Exception ignored) {
        }

        CropSimulationEntity entity = CropSimulationEntity.builder()
                .farm(farm)
                .crop(crop)
                .farmer(user)
                .cropName(result.getCropName())
                .scenarioName(req.getScenarioName() != null && !req.getScenarioName().isBlank()
                        ? req.getScenarioName() : "Simulation " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd HH:mm")))
                .waterAdjustmentPercent(req.getWaterAdjustmentPercent() != null ? req.getWaterAdjustmentPercent() : 0)
                .fertilizerAdjustmentPercent(req.getFertilizerAdjustmentPercent() != null ? req.getFertilizerAdjustmentPercent() : 100)
                .temperatureOffset(req.getTemperatureOffset() != null ? req.getTemperatureOffset() : 0.0)
                .sowingShiftDays(req.getSowingShiftDays() != null ? req.getSowingShiftDays() : 0)
                .pestPressure(req.getPestPressure() != null ? req.getPestPressure() : "NONE")
                .irrigationMethod(req.getIrrigationMethod() != null ? req.getIrrigationMethod() : "FLOOD")
                .projectedYieldQuintals(result.getProjectedYieldQuintals())
                .baselineYieldQuintals(result.getBaselineYieldQuintals())
                .yieldChangePercent(result.getYieldChangePercent())
                .inputCostPerAcre(result.getInputCostPerAcre())
                .grossRevenuePerAcre(result.getGrossRevenuePerAcre())
                .netProfitPerAcre(result.getNetProfitPerAcre())
                .profitChangePercent(result.getProfitChangePercent())
                .resilienceIndex(result.getResilienceIndex())
                .riskLevel(result.getRiskLevel())
                .waterConsumptionLitersPerAcre(result.getWaterConsumptionLitersPerAcre())
                .simulationDataJson(curveJson)
                .createdAt(LocalDateTime.now())
                .build();

        CropSimulationEntity saved = simulationRepository.save(entity);
        result.setId(saved.getId());
        return result;
    }

    @Transactional
    public List<CropSimulationDTO.SavedScenarioSummaryDto> getSavedSimulations(Long farmId, String userEmail) {
        Farm farm = resolveFarmWithPermission(farmId, userEmail);

        List<CropSimulationEntity> list = simulationRepository.findByFarmIdOrderByCreatedAtDesc(farm.getId());

        // Pre-seed realistic benchmark scenarios if farm has no saved simulations yet
        if (list.isEmpty()) {
            list = seedDefaultSimulations(farm, farm.getFarmer() != null ? farm.getFarmer().getUser() : null);
        }

        List<CropSimulationDTO.SavedScenarioSummaryDto> dtos = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        for (CropSimulationEntity e : list) {
            dtos.add(CropSimulationDTO.SavedScenarioSummaryDto.builder()
                    .id(e.getId())
                    .farmId(farm.getId())
                    .scenarioName(e.getScenarioName())
                    .cropName(e.getCropName())
                    .projectedYieldQuintals(e.getProjectedYieldQuintals())
                    .yieldChangePercent(e.getYieldChangePercent())
                    .netProfitPerAcre(e.getNetProfitPerAcre())
                    .resilienceIndex(e.getResilienceIndex())
                    .riskLevel(e.getRiskLevel())
                    .irrigationMethod(e.getIrrigationMethod())
                    .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().format(fmt) : "Recent")
                    .build());
        }
        return dtos;
    }

    @Transactional
    public void deleteSimulation(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        CropSimulationEntity entity = simulationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Simulation not found with id: " + id));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        if (!isStaff && entity.getFarmer() != null && !entity.getFarmer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You cannot delete another user's simulation.");
        }

        simulationRepository.delete(entity);
    }

    public List<CropSimulationDTO.SimulationPresetDto> getPresets() {
        return List.of(
                CropSimulationDTO.SimulationPresetDto.builder()
                        .id("optimal_drip")
                        .title("Optimal Solar Drip & Balanced Fertigation")
                        .description("Precision micro-drip irrigation with 100% balanced fertigation and zero heat stress.")
                        .icon("💧")
                        .waterAdjustmentPercent(-10) // 10% less water needed due to high efficiency
                        .fertilizerAdjustmentPercent(100)
                        .temperatureOffset(0.0)
                        .sowingShiftDays(0)
                        .pestPressure("NONE")
                        .irrigationMethod("DRIP")
                        .build(),

                CropSimulationDTO.SimulationPresetDto.builder()
                        .id("severe_drought")
                        .title("El Niño Drought Shock (-35% Water)")
                        .description("Delayed monsoon with 35% rainfall deficit and +2.5°C unseasonal heatwave.")
                        .icon("🌵")
                        .waterAdjustmentPercent(-35)
                        .fertilizerAdjustmentPercent(80)
                        .temperatureOffset(2.5)
                        .sowingShiftDays(12)
                        .pestPressure("MEDIUM")
                        .irrigationMethod("FLOOD")
                        .build(),

                CropSimulationDTO.SimulationPresetDto.builder()
                        .id("monsoon_deluge")
                        .title("Monsoon Inundation & Pest Surge")
                        .description("Heavy waterlogging (+40% excess water) accompanied by high humidity fungal pest surges.")
                        .icon("🌧️")
                        .waterAdjustmentPercent(40)
                        .fertilizerAdjustmentPercent(110)
                        .temperatureOffset(-0.5)
                        .sowingShiftDays(0)
                        .pestPressure("HIGH")
                        .irrigationMethod("FLOOD")
                        .build(),

                CropSimulationDTO.SimulationPresetDto.builder()
                        .id("regenerative_mulch")
                        .title("Climate-Resilient Bio-Mulch & Drip")
                        .description("Organic soil mulching with subsurface drip cutting evaporation by 45% with bio-fertilizers.")
                        .icon("🌿")
                        .waterAdjustmentPercent(-20)
                        .fertilizerAdjustmentPercent(90)
                        .temperatureOffset(1.0)
                        .sowingShiftDays(-5)
                        .pestPressure("LOW")
                        .irrigationMethod("MULCH_DRIP")
                        .build()
        );
    }

    private CropSimulationDTO.SimulationResultResponse runSimulationMath(
            CropSimulationDTO.SimulationRunRequest req,
            Farm farm,
            Crop crop
    ) {
        String cropKey = "wheat";
        if (req.getCropName() != null && !req.getCropName().isBlank()) {
            cropKey = req.getCropName().toLowerCase().trim();
        } else if (crop != null && crop.getCropName() != null) {
            cropKey = crop.getCropName().toLowerCase().trim();
        }

        // Match benchmark or use general agronomic profile
        CropBenchmark benchmark = null;
        for (Map.Entry<String, CropBenchmark> entry : BENCHMARKS.entrySet()) {
            if (cropKey.contains(entry.getKey())) {
                benchmark = entry.getValue();
                break;
            }
        }
        if (benchmark == null) {
            benchmark = new CropBenchmark(
                    req.getCropName() != null ? req.getCropName() : "Field Crop",
                    20.0, 2500.0, 3600000.0, 15000.0, 1.05
            );
        }

        int waterAdj = req.getWaterAdjustmentPercent() != null ? req.getWaterAdjustmentPercent() : 0;
        int fertAdj = req.getFertilizerAdjustmentPercent() != null ? req.getFertilizerAdjustmentPercent() : 100;
        double tempOffset = req.getTemperatureOffset() != null ? req.getTemperatureOffset() : 0.0;
        int sowingShift = req.getSowingShiftDays() != null ? req.getSowingShiftDays() : 0;
        String pest = req.getPestPressure() != null ? req.getPestPressure().toUpperCase() : "NONE";
        String method = req.getIrrigationMethod() != null ? req.getIrrigationMethod().toUpperCase() : "FLOOD";

        // 1. Water Stress Factor
        double waterMultiplier;
        if (waterAdj < 0) {
            // Deficit: each 10% deficit reduces yield based on crop Ky sensitivity
            double deficitRatio = Math.abs(waterAdj) / 100.0;
            waterMultiplier = Math.max(0.35, 1.0 - (deficitRatio * benchmark.kySensitivity));
        } else {
            // Excess water / inundation
            if (waterAdj <= 15) {
                waterMultiplier = 1.0 + (waterAdj * 0.003); // Slight boost
            } else {
                // Waterlogging asphyxiation
                double excess = (waterAdj - 15) / 100.0;
                waterMultiplier = Math.max(0.60, 1.045 - (excess * 0.95));
            }
        }

        // 2. Irrigation Technology Boost
        double techYieldMultiplier = 1.0;
        double techWaterSavingMultiplier = 1.0;
        double techCostMultiplier = 1.0;

        switch (method) {
            case "DRIP":
                techYieldMultiplier = 1.18; // +18% yield via direct root fertigation
                techWaterSavingMultiplier = 0.65; // 35% water savings
                techCostMultiplier = 1.12; // Slight electricity/filter operational cost
                break;
            case "MULCH_DRIP":
                techYieldMultiplier = 1.25; // +25% yield via moisture retention + weed suppression
                techWaterSavingMultiplier = 0.55; // 45% water savings
                techCostMultiplier = 1.18;
                break;
            case "SPRINKLER":
                techYieldMultiplier = 1.08;
                techWaterSavingMultiplier = 0.82;
                techCostMultiplier = 1.06;
                break;
            default: // FLOOD
                techYieldMultiplier = 1.0;
                techWaterSavingMultiplier = 1.0;
                techCostMultiplier = 1.0;
                break;
        }

        // 3. Fertilizer Nutrient Response (Diminishing marginal returns)
        double fertMultiplier;
        if (fertAdj <= 100) {
            fertMultiplier = Math.max(0.50, 0.50 + (fertAdj / 100.0) * 0.50);
        } else if (fertAdj <= 140) {
            fertMultiplier = 1.0 + ((fertAdj - 100) / 100.0) * 0.20; // Modest gains up to 140%
        } else {
            // Over-fertilization / toxicity / chemical vegetative lodging
            double excess = (fertAdj - 140) / 100.0;
            fertMultiplier = Math.max(0.85, 1.08 - (excess * 0.35));
        }

        // 4. Temperature Impact
        double tempMultiplier = 1.0;
        if (tempOffset > 0) {
            // Heatwave stress: accelerated respiration and pollen sterility
            tempMultiplier = Math.max(0.55, 1.0 - (tempOffset * 0.075));
        } else if (tempOffset < -1.0) {
            // Cold shock
            tempMultiplier = Math.max(0.70, 1.0 - (Math.abs(tempOffset + 1.0) * 0.06));
        }

        // 5. Sowing Date Penalty (Terminal heat during grain filling)
        double sowMultiplier = 1.0;
        if (sowingShift > 0) {
            sowMultiplier = Math.max(0.65, 1.0 - (sowingShift * 0.012));
        } else if (sowingShift < 0) {
            sowMultiplier = Math.min(1.04, 1.0 + (Math.abs(sowingShift) * 0.003));
        }

        // 6. Pest Infestation Penalty
        double pestMultiplier = 1.0;
        if ("LOW".equals(pest)) {
            pestMultiplier = 0.93;
        } else if ("MEDIUM".equals(pest)) {
            pestMultiplier = 0.80;
        } else if ("HIGH".equals(pest)) {
            pestMultiplier = 0.62;
        }

        // Overall Yield Calculation
        double combinedFactor = waterMultiplier * techYieldMultiplier * fertMultiplier * tempMultiplier * sowMultiplier * pestMultiplier;
        double baselineYield = benchmark.baselineYield;
        double projectedYield = Math.round((baselineYield * combinedFactor) * 10.0) / 10.0;
        double yieldChangePercent = Math.round(((projectedYield - baselineYield) / baselineYield * 100.0) * 10.0) / 10.0;

        // Financials
        double mandiPrice = benchmark.mandiPrice;
        double baseCost = benchmark.baselineCost;
        double inputCost = Math.round(baseCost * (fertAdj / 100.0) * techCostMultiplier);
        double grossRevenue = Math.round(projectedYield * mandiPrice);
        double netProfit = grossRevenue - inputCost;
        double baselineNetProfit = Math.round((baselineYield * mandiPrice) - baseCost);
        double profitChangePercent = Math.round(((netProfit - baselineNetProfit) / Math.max(1.0, baselineNetProfit) * 100.0) * 10.0) / 10.0;

        // Water Metrics
        double waterConsumption = Math.round(benchmark.waterRequirement * (1.0 + (waterAdj / 100.0)) * techWaterSavingMultiplier);
        double waterEfficiency = projectedYield > 0 ? Math.round((waterConsumption / (projectedYield * 100.0))) : 0; // Liters per Kg

        // Climate Resilience Index (0 - 100)
        int resilience = 65;
        if ("DRIP".equals(method) || "MULCH_DRIP".equals(method)) resilience += 20;
        if (fertAdj >= 85 && fertAdj <= 115) resilience += 10;
        if (Math.abs(waterAdj) <= 15) resilience += 10;
        if (tempOffset > 2.0) resilience -= 15;
        if ("HIGH".equals(pest)) resilience -= 20;
        if ("MEDIUM".equals(pest)) resilience -= 10;
        int resilienceIndex = Math.max(15, Math.min(98, resilience));

        String riskLevel = resilienceIndex >= 75 ? "LOW" : (resilienceIndex >= 50 ? "MODERATE" : "SEVERE");

        // Generate 12-Week Phenological Biomass Growth Curve
        List<CropSimulationDTO.SimulationWeeklyPointDto> curve = generateWeeklyGrowthCurve(combinedFactor);

        // Synthesize Actionable Advice & Warnings
        List<String> advice = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if ("DRIP".equals(method) || "MULCH_DRIP".equals(method)) {
            advice.add("Micro-drip fertigation increases nutrient absorption by +18% while saving approximately " + Math.round((1.0 - techWaterSavingMultiplier) * 100) + "% in irrigation energy.");
        } else if (waterAdj < -20) {
            warnings.add("Severe soil moisture deficit detected during vegetative stage. Transition to drip or schedule deficit irrigation during critical flowering window.");
        }

        if (fertAdj > 140) {
            warnings.add("Excess chemical NPK dosage exceeds root cation exchange capacity, risking fertilizer runoff and unnecessary expenditure of ₹" + (long)(inputCost - baseCost) + "/acre.");
        } else if (fertAdj < 75) {
            advice.add("Under-fertilization is capping vegetative tillering. Supplement with organic compost or green manuring to recover baseline yields.");
        }

        if (tempOffset >= 2.0) {
            warnings.add("Projected heatwave during reproductive phase may induce pollen desiccation. Apply light evening mist irrigation to lower canopy temperature.");
        }

        if (sowingShift > 10) {
            advice.add("Late sowing delays grain filling into early summer heat. Consider short-duration, heat-tolerant seed cultivars to prevent yield penalty.");
        }

        if (advice.isEmpty()) {
            advice.add("Input parameters and moisture levels are balanced within optimal agronomic thresholds for " + benchmark.displayName + ".");
        }

        return CropSimulationDTO.SimulationResultResponse.builder()
                .farmId(farm.getId())
                .farmName(farm.getFarmName())
                .cropName(benchmark.displayName)
                .scenarioName(req.getScenarioName() != null ? req.getScenarioName() : "Simulated What-If Run")
                .baselineYieldQuintals(baselineYield)
                .projectedYieldQuintals(projectedYield)
                .yieldChangePercent(yieldChangePercent)
                .mandiPricePerQuintal(mandiPrice)
                .inputCostPerAcre(inputCost)
                .grossRevenuePerAcre(grossRevenue)
                .netProfitPerAcre(netProfit)
                .baselineNetProfitPerAcre(baselineNetProfit)
                .profitChangePercent(profitChangePercent)
                .resilienceIndex(resilienceIndex)
                .riskLevel(riskLevel)
                .waterConsumptionLitersPerAcre(waterConsumption)
                .waterEfficiencyLitersPerKg(waterEfficiency)
                .irrigationMethod(method)
                .weeklyGrowthCurve(curve)
                .actionableAdvice(advice)
                .riskWarnings(warnings)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private List<CropSimulationDTO.SimulationWeeklyPointDto> generateWeeklyGrowthCurve(double yieldMultiplier) {
        List<CropSimulationDTO.SimulationWeeklyPointDto> list = new ArrayList<>();
        String[] stages = {
                "Germination & Emergence", "Seedling Establishment", "Active Vegetative", "Tillering / Branching",
                "Stem Elongation", "Canopy Closure", "Booting / Panicle Initiation", "Flowering & Anthesis",
                "Early Grain Filling / Fruit Set", "Milky / Dough Stage", "Physiological Maturity", "Harvest Readiness"
        };

        // Standard Sigmoid Growth Curve (Logistic S-Curve)
        double[] baseGrowth = { 5, 12, 22, 36, 52, 68, 80, 89, 94, 98, 100, 100 };

        for (int i = 0; i < 12; i++) {
            double base = baseGrowth[i];
            double sim = Math.min(100.0, Math.max(3.0, Math.round(base * yieldMultiplier * 10.0) / 10.0));
            double ndvi = Math.min(0.92, Math.max(0.18, Math.round((0.20 + (sim / 100.0) * 0.70) * 100.0) / 100.0));

            list.add(CropSimulationDTO.SimulationWeeklyPointDto.builder()
                    .week(i + 1)
                    .stageName(stages[i])
                    .baselineBiomass(base)
                    .simulatedBiomass(sim)
                    .simulatedNdvi(ndvi)
                    .build());
        }
        return list;
    }

    private List<CropSimulationEntity> seedDefaultSimulations(Farm farm, User user) {
        List<CropSimulationEntity> list = new ArrayList<>();

        CropSimulationEntity s1 = CropSimulationEntity.builder()
                .farm(farm)
                .farmer(user)
                .cropName("Wheat")
                .scenarioName("Baseline Flood Cultivation")
                .waterAdjustmentPercent(0)
                .fertilizerAdjustmentPercent(100)
                .temperatureOffset(0.0)
                .sowingShiftDays(0)
                .pestPressure("LOW")
                .irrigationMethod("FLOOD")
                .baselineYieldQuintals(18.5)
                .projectedYieldQuintals(17.2)
                .yieldChangePercent(-7.0)
                .inputCostPerAcre(14500.0)
                .grossRevenuePerAcre(41710.0)
                .netProfitPerAcre(27210.0)
                .profitChangePercent(-10.4)
                .resilienceIndex(62)
                .riskLevel("MODERATE")
                .waterConsumptionLitersPerAcre(3500000.0)
                .simulationDataJson("[]")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        CropSimulationEntity s2 = CropSimulationEntity.builder()
                .farm(farm)
                .farmer(user)
                .cropName("Wheat")
                .scenarioName("High-Efficiency Drip Fertigation")
                .waterAdjustmentPercent(-15)
                .fertilizerAdjustmentPercent(100)
                .temperatureOffset(0.0)
                .sowingShiftDays(0)
                .pestPressure("NONE")
                .irrigationMethod("DRIP")
                .baselineYieldQuintals(18.5)
                .projectedYieldQuintals(21.8)
                .yieldChangePercent(17.8)
                .inputCostPerAcre(16240.0)
                .grossRevenuePerAcre(52865.0)
                .netProfitPerAcre(36625.0)
                .profitChangePercent(20.6)
                .resilienceIndex(92)
                .riskLevel("LOW")
                .waterConsumptionLitersPerAcre(2275000.0)
                .simulationDataJson("[]")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        list.add(simulationRepository.save(s1));
        list.add(simulationRepository.save(s2));
        return list;
    }

    private Farm resolveFarmWithPermission(Long farmId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + farmId));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        if (!isStaff && farm.getFarmer() != null && farm.getFarmer().getUser() != null
                && !user.getId().equals(farm.getFarmer().getUser().getId())) {
            throw new AccessDeniedException("Access denied: You can only run simulations for your owned farms.");
        }

        return farm;
    }
}
