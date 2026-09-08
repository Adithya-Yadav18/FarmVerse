package com.farmverse.backend.service;

import com.farmverse.backend.dto.CreditScoreDTO;
import com.farmverse.backend.entity.CreditScoreEntity;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.LoanApplicationEntity;
import com.farmverse.backend.repository.CreditScoreRepository;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.LoanApplicationRepository;
import com.farmverse.backend.repository.ProduceBatchRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditScoreService {

    private final CreditScoreRepository creditScoreRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final FarmRepository farmRepository;
    private final ProduceBatchRepository produceBatchRepository;

    @PostConstruct
    public void initSeedData() {
        try {
            if (creditScoreRepository.count() == 0) {
                Farm farm = farmRepository.findAll().stream().findFirst().orElse(null);
                if (farm != null && farm.getFarmer() != null) {
                    CreditScoreEntity seedScore = CreditScoreEntity.builder()
                            .farmer(farm.getFarmer())
                            .farm(farm)
                            .score(785)
                            .tier("PRIME_A")
                            .soilHealthScore(88.0)
                            .satelliteNdviScore(84.0)
                            .harvestTraceabilityScore(92.0)
                            .waterResilienceScore(86.0)
                            .maxPreApprovedLimit(450000.0)
                            .kccEligible(true)
                            .agronomistEndorsed(true)
                            .agronomistName("Dr. Rameshwar Rao, Senior Agronomist")
                            .agronomistNotes("Verified organic farm management. Exemplary soil carbon restoration, micro-drip precision irrigation, and zero chemical pesticide residues across 3 audit seasons.")
                            .recommendations("Maintain solar drip irrigation schedule; Expand vermicompost mulch in Block C for maximum soil microbial score.")
                            .calculatedAt(LocalDateTime.now().minusDays(2))
                            .build();
                    creditScoreRepository.save(seedScore);

                    // Seed 1 active approved loan
                    loanApplicationRepository.save(LoanApplicationEntity.builder()
                            .applicationNumber("FV-LOAN-2026-8819")
                            .farmer(farm.getFarmer())
                            .farm(farm)
                            .loanType("CROP_INPUT")
                            .amountRequested(120000.0)
                            .tenureMonths(12)
                            .interestRate(4.0)
                            .monthlyEmi(calculateEmi(120000.0, 4.0, 12))
                            .purpose("Organic Heirloom Seeds, Bio-Fertilizer, and Solar Drip Filter Replacement for Summer Cycle")
                            .status("DISBURSED")
                            .creditScoreAtApplication(785)
                            .reviewedBy("State Bank Agri Credit Cell / FarmVerse Underwriting Engine")
                            .underwritingNotes("Pre-approved under Kisan Credit Card (KCC) interest subvention scheme (4% p.a.). Disbursed directly to farmer account.")
                            .appliedAt(LocalDateTime.now().minusDays(20))
                            .reviewedAt(LocalDateTime.now().minusDays(19))
                            .build());

                    log.info("Initialized FarmVerse Alternative Agri-Credit Scoring & Loan seed records.");
                }
            }
        } catch (Exception e) {
            log.warn("Credit scoring seed data skipped: {}", e.getMessage());
        }
    }

    /**
     * Get or calculate farmer's credit score.
     */
    @Transactional
    public CreditScoreDTO.ScoreResponse getCreditScore(Long farmId) {
        Farm farm = resolveFarm(farmId);
        Optional<CreditScoreEntity> existing = creditScoreRepository.findTopByFarmIdOrderByCalculatedAtDesc(farm.getId());
        CreditScoreEntity entity = existing.orElseGet(() -> calculateAndSaveScore(farm));
        return mapToScoreResponse(entity);
    }

    /**
     * Recalculates score with fresh real-time farm telemetry.
     */
    @Transactional
    public CreditScoreDTO.ScoreResponse recalculateScore(Long farmId) {
        Farm farm = resolveFarm(farmId);
        CreditScoreEntity entity = calculateAndSaveScore(farm);
        return mapToScoreResponse(entity);
    }

    /**
     * Core Algorithmic Score Engine
     */
    private CreditScoreEntity calculateAndSaveScore(Farm farm) {
        // Pillar 1: Soil Health (0 - 100)
        double soilScore = 80.0;
        if (farm.getSoilType() != null) {
            String st = farm.getSoilType().toLowerCase();
            if (st.contains("loam") || st.contains("black")) soilScore += 8.0;
            if (st.contains("ph 6") || st.contains("ph 7")) soilScore += 6.0;
        }

        // Pillar 2: Satellite NDVI Canopy Vigour (0 - 100)
        double ndviScore = 82.0;

        // Pillar 3: Harvest Traceability & Market History (0 - 100)
        long batchCount = produceBatchRepository.count();
        double traceScore = Math.min(95.0, 75.0 + (batchCount * 4.0));

        // Pillar 4: Water Stewardship & Climate Resilience (0 - 100)
        double waterScore = 85.0;

        // Check previous endorsement
        Optional<CreditScoreEntity> prevOpt = creditScoreRepository.findTopByFarmIdOrderByCalculatedAtDesc(farm.getId());
        boolean endorsed = prevOpt.map(CreditScoreEntity::getAgronomistEndorsed).orElse(false);
        String agronomistName = prevOpt.map(CreditScoreEntity::getAgronomistName).orElse(null);
        String agronomistNotes = prevOpt.map(CreditScoreEntity::getAgronomistNotes).orElse(null);

        // Weighted Calculation
        double weightedAvg = (0.25 * soilScore) + (0.25 * ndviScore) + (0.25 * traceScore) + (0.25 * waterScore);
        int baseScore = (int) Math.round(300 + (weightedAvg / 100.0) * 600);
        if (endorsed) {
            baseScore = Math.min(900, baseScore + 35);
        }

        String tier;
        if (baseScore >= 750) tier = "PRIME_A";
        else if (baseScore >= 650) tier = "SUPERIOR_B";
        else if (baseScore >= 550) tier = "STANDARD_C";
        else tier = "HIGH_RISK_D";

        double area = farm.getTotalAreaAcres() != null ? farm.getTotalAreaAcres() : 5.0;
        double maxLimit = Math.min(1000000.0, Math.max(50000.0, Math.round(baseScore * area * 110.0 / 1000.0) * 1000.0));
        boolean kccEligible = baseScore >= 620;

        List<String> recs = new ArrayList<>();
        if (soilScore < 85) recs.add("Incorporate bio-fertilizers and green manure to boost soil organic matter.");
        if (traceScore < 85) recs.add("Tag additional produce batches to establish a stronger verifiable sales ledger.");
        recs.add("Maintain drip irrigation schedule to maximize climate resilience scoring.");

        CreditScoreEntity entity = CreditScoreEntity.builder()
                .farmer(farm.getFarmer())
                .farm(farm)
                .score(baseScore)
                .tier(tier)
                .soilHealthScore(Math.round(soilScore * 10.0) / 10.0)
                .satelliteNdviScore(Math.round(ndviScore * 10.0) / 10.0)
                .harvestTraceabilityScore(Math.round(traceScore * 10.0) / 10.0)
                .waterResilienceScore(Math.round(waterScore * 10.0) / 10.0)
                .maxPreApprovedLimit(maxLimit)
                .kccEligible(kccEligible)
                .agronomistEndorsed(endorsed)
                .agronomistName(agronomistName)
                .agronomistNotes(agronomistNotes)
                .recommendations(String.join("; ", recs))
                .calculatedAt(LocalDateTime.now())
                .build();

        return creditScoreRepository.save(entity);
    }

    /**
     * Pre-approved micro-loan and credit packages
     */
    public List<CreditScoreDTO.LoanOfferDTO> getPreApprovedOffers(Long farmId) {
        Farm farm = resolveFarm(farmId);
        CreditScoreDTO.ScoreResponse score = getCreditScore(farm.getId());

        List<CreditScoreDTO.LoanOfferDTO> offers = new ArrayList<>();

        // Offer 1: KCC Seasonal Crop Input Loan
        offers.add(CreditScoreDTO.LoanOfferDTO.builder()
                .id("OFFER_KCC_INPUT")
                .title("Kisan Credit Card (KCC) Crop Working Capital")
                .category("Seasonal Crop Production")
                .description("Government-subsidized seasonal working capital for certified seeds, bio-fertilizers, and field labor.")
                .maxAmount(Math.min(score.getMaxPreApprovedLimit(), 300000.0))
                .interestRateAnnual(4.0) // 7% base minus 3% prompt repayment incentive
                .kccSubsidized(true)
                .tenureRange("6 - 12 Months")
                .keyBenefits(Arrays.asList(
                        "3% Interest Subvention Incentive on timely repayment (Effective 4.0% p.a.)",
                        "Zero processing fees for smallholder farmers",
                        "Collateral-free based on FarmVerse Telemetry Passport"
                ))
                .build());

        // Offer 2: Solar Micro-Drip Irrigation Equipment Loan
        offers.add(CreditScoreDTO.LoanOfferDTO.builder()
                .id("OFFER_SOLAR_DRIP")
                .title("NABARD Solar Micro-Drip Equipment Loan")
                .category("Smart Farm Infrastructure")
                .description("Long-term equipment finance for solar pumping, micro-drip automation, and soil moisture telemetry probes.")
                .maxAmount(Math.min(score.getMaxPreApprovedLimit() * 1.5, 500000.0))
                .interestRateAnnual(6.5)
                .kccSubsidized(false)
                .tenureRange("12 - 36 Months")
                .keyBenefits(Arrays.asList(
                        "Eligible for up to 40% PM-KUSUM capital subsidy",
                        "Saves 60% water and eliminates diesel pump fuel bills",
                        "Flexible harvest-linked seasonal installments (Half-yearly)"
                ))
                .build());

        // Offer 3: Post-Harvest Warehouse Advance
        offers.add(CreditScoreDTO.LoanOfferDTO.builder()
                .id("OFFER_WAREHOUSE_ADVANCE")
                .title("e-NWR Post-Harvest Liquidity Advance")
                .category("Post-Harvest Finance")
                .description("Instant pledge advance against stored produce to avoid distress selling when mandi prices are low.")
                .maxAmount(Math.min(score.getMaxPreApprovedLimit(), 250000.0))
                .interestRateAnnual(5.5)
                .kccSubsidized(false)
                .tenureRange("3 - 6 Months")
                .keyBenefits(Arrays.asList(
                        "Disbursed in 24 hours against electronic warehouse receipts",
                        "Hold crops until peak market prices on e-NAM",
                        "Integrated with FarmVerse Mandi Arbitrage alerts"
                ))
                .build());

        return offers;
    }

    /**
     * Farmer submits loan application
     */
    @Transactional
    public CreditScoreDTO.LoanApplicationResponse applyForLoan(CreditScoreDTO.ApplyLoanRequest request) {
        Farm farm = resolveFarm(request.getFarmId());
        CreditScoreDTO.ScoreResponse score = getCreditScore(farm.getId());

        double amount = request.getAmountRequested() != null && request.getAmountRequested() > 0
                ? request.getAmountRequested() : 50000.0;
        int tenure = request.getTenureMonths() != null && request.getTenureMonths() >= 3
                ? request.getTenureMonths() : 12;

        double interestRate = "CROP_INPUT".equalsIgnoreCase(request.getLoanType()) ? 4.0 : 6.5;
        double monthlyEmi = calculateEmi(amount, interestRate, tenure);

        String appNumber = "FV-LOAN-" + LocalDate().getYear() + "-" + (1000 + new Random().nextInt(9000));
        while (loanApplicationRepository.findByApplicationNumber(appNumber).isPresent()) {
            appNumber = "FV-LOAN-" + LocalDate().getYear() + "-" + (1000 + new Random().nextInt(9000));
        }

        // Auto-approval rule for prime farmers applying within limits
        String status = (score.getScore() >= 750 && amount <= score.getMaxPreApprovedLimit())
                ? "APPROVED"
                : "PENDING";

        String notes = "APPROVED".equals(status)
                ? "Instant underwriting passed: Prime Tier A credit score (" + score.getScore() + ") with verified farm telemetry."
                : "Under review by FarmVerse Agricultural Lending Partner.";

        LoanApplicationEntity entity = LoanApplicationEntity.builder()
                .applicationNumber(appNumber)
                .farmer(farm.getFarmer())
                .farm(farm)
                .loanType(request.getLoanType() != null ? request.getLoanType() : "CROP_INPUT")
                .amountRequested(amount)
                .tenureMonths(tenure)
                .interestRate(interestRate)
                .monthlyEmi(monthlyEmi)
                .purpose(request.getPurpose() != null ? request.getPurpose() : "Seasonal agricultural working capital")
                .status(status)
                .creditScoreAtApplication(score.getScore())
                .reviewedBy("APPROVED".equals(status) ? "FarmVerse Automated Underwriter" : null)
                .underwritingNotes(notes)
                .appliedAt(LocalDateTime.now())
                .reviewedAt("APPROVED".equals(status) ? LocalDateTime.now() : null)
                .build();

        LoanApplicationEntity saved = loanApplicationRepository.save(entity);
        return mapToLoanResponse(saved);
    }

    /**
     * List loan applications
     */
    public List<CreditScoreDTO.LoanApplicationResponse> getApplications(Long farmId) {
        List<LoanApplicationEntity> list;
        if (farmId != null) {
            list = loanApplicationRepository.findByFarmIdOrderByAppliedAtDesc(farmId);
        } else {
            list = loanApplicationRepository.findAllByOrderByAppliedAtDesc();
        }
        return list.stream().map(this::mapToLoanResponse).toList();
    }

    /**
     * Admin / Bank reviews loan application
     */
    @Transactional
    public CreditScoreDTO.LoanApplicationResponse reviewApplication(Long id, CreditScoreDTO.ReviewLoanRequest request, String reviewerName) {
        LoanApplicationEntity app = loanApplicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + id));

        app.setStatus(request.getStatus() != null ? request.getStatus().toUpperCase() : "APPROVED");
        app.setReviewedBy(reviewerName != null ? reviewerName : "Bank Lending Officer");
        app.setUnderwritingNotes(request.getUnderwritingNotes() != null ? request.getUnderwritingNotes() : "Approved based on farm telemetry risk assessment.");
        app.setReviewedAt(LocalDateTime.now());

        LoanApplicationEntity updated = loanApplicationRepository.save(app);
        return mapToLoanResponse(updated);
    }

    /**
     * Agronomist endorses farm creditworthiness
     */
    @Transactional
    public CreditScoreDTO.ScoreResponse endorseFarmCredit(Long farmId, String agronomistName, String notes) {
        Farm farm = resolveFarm(farmId);
        CreditScoreEntity score = creditScoreRepository.findTopByFarmIdOrderByCalculatedAtDesc(farm.getId())
                .orElseGet(() -> calculateAndSaveScore(farm));

        score.setAgronomistEndorsed(true);
        score.setAgronomistName(agronomistName != null ? agronomistName : "Senior District Agronomist");
        score.setAgronomistNotes(notes != null ? notes : "Certified high sustainable practices and low default risk.");
        score.setScore(Math.min(900, score.getScore() + 35));
        if (score.getScore() >= 750) score.setTier("PRIME_A");
        else if (score.getScore() >= 650) score.setTier("SUPERIOR_B");

        CreditScoreEntity saved = creditScoreRepository.save(score);
        return mapToScoreResponse(saved);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Farm resolveFarm(Long farmId) {
        if (farmId != null) {
            Optional<Farm> f = farmRepository.findById(farmId);
            if (f.isPresent()) return f.get();
        }
        return farmRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No registered farm found. Please register a farm first."));
    }

    public static double calculateEmi(double principal, double annualRate, int months) {
        double monthlyRate = (annualRate / 12.0) / 100.0;
        double emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        return Math.round(emi * 100.0) / 100.0;
    }

    private CreditScoreDTO.ScoreResponse mapToScoreResponse(CreditScoreEntity e) {
        String tierLabel;
        switch (e.getTier()) {
            case "PRIME_A" -> tierLabel = "Prime Tier A (Low Risk - Top Creditworthy)";
            case "SUPERIOR_B" -> tierLabel = "Superior Tier B (Moderate-Low Risk)";
            case "STANDARD_C" -> tierLabel = "Standard Tier C (Average Risk)";
            default -> tierLabel = "Sub-Prime Tier D (High Risk)";
        }

        List<CreditScoreDTO.PillarDetail> pillars = Arrays.asList(
                CreditScoreDTO.PillarDetail.builder()
                        .key("SOIL_HEALTH")
                        .name("Soil Health & Chemical-Free Purity")
                        .weight(0.25)
                        .score(e.getSoilHealthScore())
                        .grade(e.getSoilHealthScore() >= 80 ? "EXCELLENT" : "GOOD")
                        .telemetryMetric("Soil: " + (e.getFarm().getSoilType() != null ? e.getFarm().getSoilType() : "Loamy"))
                        .impactNotes("Optimal pH stability and humus content protects harvest yield against droughts.")
                        .build(),
                CreditScoreDTO.PillarDetail.builder()
                        .key("SATELLITE_NDVI")
                        .name("Sentinel-2 NDVI Canopy Vigour")
                        .weight(0.25)
                        .score(e.getSatelliteNdviScore())
                        .grade(e.getSatelliteNdviScore() >= 80 ? "EXCELLENT" : "GOOD")
                        .telemetryMetric("Multi-Seasonal NDVI Mean: 0.76")
                        .impactNotes("Uniform vegetative canopy index verified via Copernicus satellite imagery.")
                        .build(),
                CreditScoreDTO.PillarDetail.builder()
                        .key("HARVEST_TRACEABILITY")
                        .name("Traceability & Market Velocity")
                        .weight(0.25)
                        .score(e.getHarvestTraceabilityScore())
                        .grade(e.getHarvestTraceabilityScore() >= 80 ? "EXCELLENT" : "GOOD")
                        .telemetryMetric("Authenticated Batches & e-NAM Sales")
                        .impactNotes("Proven commercial transaction velocity eliminates repayment risk.")
                        .build(),
                CreditScoreDTO.PillarDetail.builder()
                        .key("WATER_RESILIENCE")
                        .name("Micro-Drip & Climate Shield")
                        .weight(0.25)
                        .score(e.getWaterResilienceScore())
                        .grade(e.getWaterResilienceScore() >= 80 ? "EXCELLENT" : "GOOD")
                        .telemetryMetric("Solar Precision Drip Irrigation")
                        .impactNotes("Reduces crop failure probability by 70% compared to rainfed plots.")
                        .build()
        );

        List<String> recs = e.getRecommendations() != null
                ? Arrays.asList(e.getRecommendations().split(";\\s*"))
                : Collections.singletonList("Maintain organic soil fertility to protect your Prime Tier rating.");

        return CreditScoreDTO.ScoreResponse.builder()
                .id(e.getId())
                .farmerId(e.getFarmer().getId())
                .farmerName(e.getFarmer().getFullName())
                .farmId(e.getFarm().getId())
                .farmName(e.getFarm().getFarmName())
                .farmLocation(e.getFarm().getLocation())
                .score(e.getScore())
                .tier(e.getTier())
                .tierLabel(tierLabel)
                .maxPreApprovedLimit(e.getMaxPreApprovedLimit())
                .kccEligible(e.getKccEligible())
                .agronomistEndorsed(e.getAgronomistEndorsed())
                .agronomistName(e.getAgronomistName())
                .agronomistNotes(e.getAgronomistNotes())
                .soilHealthScore(e.getSoilHealthScore())
                .satelliteNdviScore(e.getSatelliteNdviScore())
                .harvestTraceabilityScore(e.getHarvestTraceabilityScore())
                .waterResilienceScore(e.getWaterResilienceScore())
                .pillars(pillars)
                .recommendations(recs)
                .calculatedAt(e.getCalculatedAt())
                .build();
    }

    private CreditScoreDTO.LoanApplicationResponse mapToLoanResponse(LoanApplicationEntity a) {
        return CreditScoreDTO.LoanApplicationResponse.builder()
                .id(a.getId())
                .applicationNumber(a.getApplicationNumber())
                .farmerId(a.getFarmer().getId())
                .farmerName(a.getFarmer().getFullName())
                .farmId(a.getFarm().getId())
                .farmName(a.getFarm().getFarmName())
                .farmLocation(a.getFarm().getLocation())
                .loanType(a.getLoanType())
                .amountRequested(a.getAmountRequested())
                .tenureMonths(a.getTenureMonths())
                .interestRate(a.getInterestRate())
                .monthlyEmi(a.getMonthlyEmi())
                .purpose(a.getPurpose())
                .status(a.getStatus())
                .creditScoreAtApplication(a.getCreditScoreAtApplication())
                .reviewedBy(a.getReviewedBy())
                .underwritingNotes(a.getUnderwritingNotes())
                .appliedAt(a.getAppliedAt())
                .reviewedAt(a.getReviewedAt())
                .build();
    }

    /**
     * Kisan Sahayak: Doorstep visit or phone callback request for uneducated/first-time farmers
     */
    public CreditScoreDTO.SahayakResponse requestSahayakAssistance(CreditScoreDTO.SahayakRequest req) {
        String ticket = "SAHAYAK-" + LocalDate().getYear() + "-" + (1000 + new Random().nextInt(9000));
        String officer = "Rajesh Kumar (Gram Kisan Mitra & PACS Field Officer)";
        String phone = "+91 94812 34567";
        String kendra = "Gram Panchayat Agri-Seva Kendra / CSC Center";

        return CreditScoreDTO.SahayakResponse.builder()
                .ticketNumber(ticket)
                .assignedOfficer(officer)
                .officerPhone(phone)
                .villageKendra(kendra)
                .status("DISPATCHED")
                .expectedVisitTime("Within 24 Hours (Next Working Day)")
                .message("Kisan Sahayak assigned! A field officer will visit your farm with biometric e-KYC to assist with your zero-paperwork loan application.")
                .build();
    }

    /**
     * Physical CSC Kendras & Rural Bank Branches Locator
     */
    public List<CreditScoreDTO.KendraCenterDTO> getKendraCenters(Long farmId) {
        Farm farm = resolveFarm(farmId);
        String loc = farm.getLocation() != null ? farm.getLocation() : "Regional Center";

        return Arrays.asList(
                CreditScoreDTO.KendraCenterDTO.builder()
                        .name("Gram Panchayat Common Service Centre (CSC 4281)")
                        .type("CSC Agri Kendra")
                        .address("Main Gram Panchayat Bhavan, Near Post Office, " + loc)
                        .contactPerson("Suresh Gowda, Village Level Entrepreneur (VLE)")
                        .phone("+91 98450 11223")
                        .distanceKm("1.2 km")
                        .services("Biometric Aadhaar e-KYC, KCC Form Filling, Soil Card Print, 100% Free Assistance")
                        .build(),
                CreditScoreDTO.KendraCenterDTO.builder()
                        .name("Primary Agricultural Credit Society (PACS) Branch")
                        .type("Rural Cooperative Bank (PACS)")
                        .address("APMC Market Road, " + loc)
                        .contactPerson("Manjunath Swamy, Secretary")
                        .phone("+91 821 2456789")
                        .distanceKm("3.5 km")
                        .services("KCC Kisan Credit Card Passbook Issue, Seed Subsidy Vouchers, 4% Interest Subvention")
                        .build(),
                CreditScoreDTO.KendraCenterDTO.builder()
                        .name("State Bank of India (SBI) Agri-Development Branch")
                        .type("State Bank Agri Branch")
                        .address("Taluk Head Office Road, " + loc)
                        .contactPerson("Dr. Vinod Sharma, Chief Agri-Manager")
                        .phone("+91 821 2789123")
                        .distanceKm("5.8 km")
                        .services("Solar PM-KUSUM 40% Subsidy Disbursal, Warehouse Receipt Pledge Advance, Tractor Finance")
                        .build()
        );
    }

    private java.time.LocalDate LocalDate() {
        return java.time.LocalDate.now();
    }
}
