package com.farmverse.backend.service;

import com.farmverse.backend.dto.CarbonFootprintDTO;
import com.farmverse.backend.entity.CarbonCreditListingEntity;
import com.farmverse.backend.entity.CarbonFootprintEntity;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.CarbonCreditListingRepository;
import com.farmverse.backend.repository.CarbonFootprintRepository;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CarbonFootprintService {

    private final CarbonFootprintRepository footprintRepository;
    private final CarbonCreditListingRepository listingRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // Emission Factors (IPCC Tier-1 Agriculture)
    private static final double DIESEL_FACTOR_KG_PER_LITER = 2.68;
    private static final double FERTILIZER_FACTOR_KG_PER_KG_N = 5.80;
    private static final double GRID_ELEC_FACTOR_KG_PER_KWH = 0.82;
    private static final double CONVENTIONAL_TILL_KG_PER_ACRE = 450.0;
    private static final double REDUCED_TILL_KG_PER_ACRE = 180.0;
    private static final double STUBBLE_BURN_PENALTY_KG_PER_ACRE = 1200.0;

    // Sequestration Factors
    private static final double TREE_SEQUESTRATION_KG_PER_YEAR = 22.0;
    private static final double BIOCHAR_SEQUESTRATION_KG_PER_TON = 1800.0;
    private static final double COVER_CROP_SEQUESTRATION_KG_PER_ACRE = 1200.0;

    public CarbonFootprintService(
            CarbonFootprintRepository footprintRepository,
            CarbonCreditListingRepository listingRepository,
            FarmRepository farmRepository,
            UserRepository userRepository
    ) {
        this.footprintRepository = footprintRepository;
        this.listingRepository = listingRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public CarbonFootprintDTO.CarbonAuditResponse auditFarmCarbon(
            CarbonFootprintDTO.CarbonAuditRequest req,
            String userEmail
    ) {
        Farm farm = resolveFarmWithPermission(req.getFarmId(), userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return computeAndSaveAudit(req, farm, user);
    }

    @Transactional
    public CarbonFootprintDTO.CarbonAuditResponse getLatestAuditForFarm(Long farmId, String userEmail) {
        Farm farm = resolveFarmWithPermission(farmId, userEmail);

        Optional<CarbonFootprintEntity> existingOpt = footprintRepository.findLatestByFarmId(farm.getId());
        if (existingOpt.isPresent()) {
            return mapToAuditResponse(existingOpt.get());
        }

        // Pre-seed realistic green audit for demo farms
        User user = farm.getFarmer() != null ? farm.getFarmer().getUser() :
                userRepository.findByEmail(userEmail).orElse(null);

        CarbonFootprintDTO.CarbonAuditRequest defaultReq = CarbonFootprintDTO.CarbonAuditRequest.builder()
                .farmId(farm.getId())
                .dieselUsageLiters(180.0)
                .syntheticFertilizerKg(120.0)
                .electricityKwh(450.0)
                .tillageMethod("REDUCED")
                .stubbleBurningAvoided(true)
                .solarPumpInstalled(true)
                .dripIrrigationActive(true)
                .biocharCompostTons(4.5)
                .agroforestryTreesCount(85)
                .coverCroppingAcres(3.0)
                .build();

        return computeAndSaveAudit(defaultReq, farm, user);
    }

    @Transactional
    public CarbonFootprintDTO.CarbonCreditListingDto listCarbonCredits(
            CarbonFootprintDTO.ListCreditsRequest req,
            String userEmail
    ) {
        Farm farm = resolveFarmWithPermission(req.getFarmId(), userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        CarbonFootprintEntity latest = footprintRepository.findLatestByFarmId(farm.getId())
                .orElseThrow(() -> new IllegalStateException("Please run a Carbon Audit for your farm before listing credits."));

        double available = latest.getCarbonCreditsMinted() != null ? latest.getCarbonCreditsMinted() : 0.0;
        if (available <= 0.0) {
            throw new IllegalArgumentException("Your farm does not currently have positive verified carbon credits to list. Adopt regenerative practices to mint credits.");
        }

        double creditsToList = req.getCreditsToList() != null && req.getCreditsToList() > 0
                ? Math.min(req.getCreditsToList(), available) : available;
        double price = req.getPricePerCreditInr() != null && req.getPricePerCreditInr() > 0
                ? req.getPricePerCreditInr() : 1850.0;

        String serial = "FV-CARB-" + LocalDateTime.now().getYear() + "-F" + farm.getId() + "-" + (100 + new Random().nextInt(900));

        CarbonCreditListingEntity entity = CarbonCreditListingEntity.builder()
                .footprint(latest)
                .farm(farm)
                .farmer(user)
                .creditsAvailable(creditsToList)
                .pricePerCreditInr(price)
                .certificateSerial(serial)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        CarbonCreditListingEntity saved = listingRepository.save(entity);
        return mapToListingDto(saved);
    }

    public List<CarbonFootprintDTO.CarbonCreditListingDto> getActiveMarketplaceListings() {
        List<CarbonCreditListingEntity> listings = listingRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        if (listings.isEmpty()) {
            seedMarketplaceListings();
            listings = listingRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        }

        List<CarbonFootprintDTO.CarbonCreditListingDto> dtos = new ArrayList<>();
        for (CarbonCreditListingEntity l : listings) {
            dtos.add(mapToListingDto(l));
        }
        return dtos;
    }

    @Transactional
    public CarbonFootprintDTO.CertificateReceiptDto buyAndRetireCredits(
            Long listingId,
            CarbonFootprintDTO.BuyCreditRequest req,
            String buyerEmail
    ) {
        CarbonCreditListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Credit listing not found with id: " + listingId));

        if (!"ACTIVE".equals(listing.getStatus())) {
            throw new IllegalStateException("This carbon credit parcel is no longer active.");
        }

        double requested = req.getCreditsToBuy() != null && req.getCreditsToBuy() > 0
                ? req.getCreditsToBuy() : listing.getCreditsAvailable();
        double purchased = Math.min(requested, listing.getCreditsAvailable());

        listing.setCreditsAvailable(listing.getCreditsAvailable() - purchased);
        if (listing.getCreditsAvailable() <= 0.05) {
            listing.setStatus("RETIRED");
        }
        listing.setBuyerName(req.getBuyerName() != null ? req.getBuyerName() : "Eco-Conscious Corporate Partner");
        listing.setBuyerEmail(buyerEmail);
        listing.setBuyerOrganization(req.getBuyerOrganization() != null ? req.getBuyerOrganization() : "ESG Verified Carbon Offset");
        listing.setPurchasedAt(LocalDateTime.now());
        listingRepository.save(listing);

        String serial = listing.getCertificateSerial();
        String hash = "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();

        return CarbonFootprintDTO.CertificateReceiptDto.builder()
                .certificateSerial(serial)
                .farmName(listing.getFarm().getFarmName())
                .farmerName(listing.getFarmer() != null ? listing.getFarmer().getFullName() : "Regenerative Farm Partner")
                .location(listing.getFarm().getLocation() != null ? listing.getFarm().getLocation() : "India")
                .creditsRetired(purchased)
                .co2OffsetTonnes(purchased)
                .buyerName(listing.getBuyerName())
                .buyerOrganization(listing.getBuyerOrganization())
                .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy HH:mm")))
                .verificationHash(hash)
                .build();
    }

    private CarbonFootprintDTO.CarbonAuditResponse computeAndSaveAudit(
            CarbonFootprintDTO.CarbonAuditRequest req,
            Farm farm,
            User user
    ) {
        double dieselLiters = req.getDieselUsageLiters() != null ? req.getDieselUsageLiters() : 150.0;
        double fertilizerKg = req.getSyntheticFertilizerKg() != null ? req.getSyntheticFertilizerKg() : 100.0;
        double electricityKwh = req.getElectricityKwh() != null ? req.getElectricityKwh() : 400.0;
        String tillage = req.getTillageMethod() != null ? req.getTillageMethod().toUpperCase() : "REDUCED";
        boolean stubbleAvoided = req.getStubbleBurningAvoided() == null || req.getStubbleBurningAvoided();
        boolean solar = Boolean.TRUE.equals(req.getSolarPumpInstalled());
        boolean drip = Boolean.TRUE.equals(req.getDripIrrigationActive());
        double biocharTons = req.getBiocharCompostTons() != null ? req.getBiocharCompostTons() : 4.0;
        int trees = req.getAgroforestryTreesCount() != null ? req.getAgroforestryTreesCount() : 60;
        double coverAcres = req.getCoverCroppingAcres() != null ? req.getCoverCroppingAcres() : 2.5;

        // 1. Calculate Gross Emissions
        double dieselFactor = solar ? 0.20 : 1.0; // Solar pump replaces 80% of diesel irrigation
        double dieselEmission = dieselLiters * DIESEL_FACTOR_KG_PER_LITER * dieselFactor;
        double fertEmission = fertilizerKg * FERTILIZER_FACTOR_KG_PER_KG_N;
        double elecFactor = solar ? 0.15 : (drip ? 0.65 : 1.0);
        double elecEmission = electricityKwh * GRID_ELEC_FACTOR_KG_PER_KWH * elecFactor;

        double tillEmission = "CONVENTIONAL".equals(tillage) ? CONVENTIONAL_TILL_KG_PER_ACRE * 2.0 :
                ("REDUCED".equals(tillage) ? REDUCED_TILL_KG_PER_ACRE * 2.0 : 0.0);
        double stubbleEmission = stubbleAvoided ? 0.0 : STUBBLE_BURN_PENALTY_KG_PER_ACRE * 2.0;

        double totalEmissions = Math.round((dieselEmission + fertEmission + elecEmission + tillEmission + stubbleEmission) * 10.0) / 10.0;

        // 2. Calculate Regenerative Sequestration
        double treeSeq = trees * TREE_SEQUESTRATION_KG_PER_YEAR;
        double biocharSeq = biocharTons * BIOCHAR_SEQUESTRATION_KG_PER_TON;
        double coverCropSeq = coverAcres * COVER_CROP_SEQUESTRATION_KG_PER_ACRE;
        double solarAvoidance = solar ? (dieselLiters * 0.80 * DIESEL_FACTOR_KG_PER_LITER + electricityKwh * 0.85 * GRID_ELEC_FACTOR_KG_PER_KWH) : 0.0;
        double dripSavings = drip ? (fertilizerKg * 0.25 * FERTILIZER_FACTOR_KG_PER_KG_N) : 0.0; // 25% fertilizer saved via fertigation

        double totalSequestration = Math.round((treeSeq + biocharSeq + coverCropSeq + solarAvoidance + dripSavings) * 10.0) / 10.0;

        // 3. Net Carbon Balance
        double netCarbon = Math.round((totalEmissions - totalSequestration) * 10.0) / 10.0;
        boolean isNetNegative = netCarbon <= 0;

        // Carbon Credits Minted (1 Credit = 1000 kg CO2e sequestered)
        double creditsMinted = 0.0;
        String rating = "INTENSIVE_C";

        if (isNetNegative) {
            creditsMinted = Math.round((Math.abs(netCarbon) / 1000.0) * 10.0) / 10.0;
            rating = "NET_NEGATIVE_A_PLUS";
        } else if (totalSequestration >= totalEmissions * 0.70) {
            creditsMinted = Math.round(((totalSequestration * 0.5) / 1000.0) * 10.0) / 10.0;
            rating = "LOW_CARBON_A";
        } else if (totalSequestration >= totalEmissions * 0.40) {
            creditsMinted = Math.round(((totalSequestration * 0.2) / 1000.0) * 10.0) / 10.0;
            rating = "BALANCED_B";
        }

        // 4. Breakdown Items
        List<CarbonFootprintDTO.EmissionItemDto> emissionsBreakdown = new ArrayList<>();
        double safeTotalEm = totalEmissions > 0 ? totalEmissions : 1.0;
        emissionsBreakdown.add(new CarbonFootprintDTO.EmissionItemDto("Diesel Machinery & Pumps", Math.round(dieselEmission * 10.0) / 10.0, (double) Math.round((dieselEmission / safeTotalEm * 100.0)), "🚜", "Switch to solar micro-irrigation to eliminate diesel combustion."));
        emissionsBreakdown.add(new CarbonFootprintDTO.EmissionItemDto("Synthetic NPK Fertilizer", Math.round(fertEmission * 10.0) / 10.0, (double) Math.round((fertEmission / safeTotalEm * 100.0)), "🧪", "Apply biochar compost and neem-coated urea to halve N2O emissions."));
        emissionsBreakdown.add(new CarbonFootprintDTO.EmissionItemDto("Grid Electricity Usage", Math.round(elecEmission * 10.0) / 10.0, (double) Math.round((elecEmission / safeTotalEm * 100.0)), "⚡", "Deploy PM-KUSUM solar panels to achieve grid independence."));
        emissionsBreakdown.add(new CarbonFootprintDTO.EmissionItemDto("Soil Tillage Oxidation", Math.round(tillEmission * 10.0) / 10.0, (double) Math.round((tillEmission / safeTotalEm * 100.0)), "🌱", "Adopt Zero-Till farming to preserve soil fungal carbon networks."));
        if (!stubbleAvoided) {
            emissionsBreakdown.add(new CarbonFootprintDTO.EmissionItemDto("Stubble Burning Penalty", Math.round(stubbleEmission * 10.0) / 10.0, (double) Math.round((stubbleEmission / safeTotalEm * 100.0)), "🔥", "Use Happy Seeder or bio-decomposer to incorporate straw into soil humus."));
        }

        List<CarbonFootprintDTO.SequestrationItemDto> seqBreakdown = new ArrayList<>();
        double safeTotalSeq = totalSequestration > 0 ? totalSequestration : 1.0;
        seqBreakdown.add(new CarbonFootprintDTO.SequestrationItemDto("Agroforestry Canopy (Trees)", Math.round(treeSeq * 10.0) / 10.0, (double) Math.round((treeSeq / safeTotalSeq * 100.0)), "🌳", "40-year permanent wood biomass carbon sink"));
        seqBreakdown.add(new CarbonFootprintDTO.SequestrationItemDto("Biochar Organic Humus", Math.round(biocharSeq * 10.0) / 10.0, (double) Math.round((biocharSeq / safeTotalSeq * 100.0)), "🧱", "100-year recalcitrant soil black carbon"));
        seqBreakdown.add(new CarbonFootprintDTO.SequestrationItemDto("Cover Crops & Green Manure", Math.round(coverCropSeq * 10.0) / 10.0, (double) Math.round((coverCropSeq / safeTotalSeq * 100.0)), "🌿", "Continuous root exudate & fungal biomass"));
        seqBreakdown.add(new CarbonFootprintDTO.SequestrationItemDto("Solar & Drip Displacement", Math.round((solarAvoidance + dripSavings) * 10.0) / 10.0, (double) Math.round(((solarAvoidance + dripSavings) / safeTotalSeq * 100.0)), "☀️", "Avoided fossil fuel and fertilizer synthesis"));

        List<String> recommendations = new ArrayList<>();
        if (!solar) recommendations.add("Install a 5HP solar irrigation pump through PM-KUSUM to cut emissions by ~1,200 kg CO2e annually.");
        if (biocharTons < 3.0) recommendations.add("Increase biochar application to 5 tons/acre to lock an additional 3,600 kg of recalcitrant carbon into your soil.");
        if (trees < 50) recommendations.add("Plant boundary agroforestry trees (Melia Dubia, Teak, or Moringa) to mint 1 to 2 extra carbon credits each year.");
        if (recommendations.isEmpty()) {
            recommendations.add("Your farm is operating at elite Net-Negative Green Sink efficiency! Maintain zero-till and continuous cover cropping.");
        }

        CarbonFootprintEntity entity = CarbonFootprintEntity.builder()
                .farm(farm)
                .farmer(user)
                .periodYear(LocalDateTime.now().getYear())
                .dieselUsageLiters(dieselLiters)
                .syntheticFertilizerKg(fertilizerKg)
                .electricityKwh(electricityKwh)
                .tillageMethod(tillage)
                .stubbleBurningAvoided(stubbleAvoided)
                .solarPumpInstalled(solar)
                .dripIrrigationActive(drip)
                .biocharCompostTons(biocharTons)
                .agroforestryTreesCount(trees)
                .coverCroppingAcres(coverAcres)
                .totalEmissionsKgCo2(totalEmissions)
                .totalSequestrationKgCo2(totalSequestration)
                .netCarbonKgCo2(netCarbon)
                .carbonCreditsMinted(creditsMinted)
                .carbonRating(rating)
                .auditDetailsJson("[]")
                .createdAt(LocalDateTime.now())
                .build();

        CarbonFootprintEntity saved = footprintRepository.save(entity);
        return mapToAuditResponse(saved, emissionsBreakdown, seqBreakdown, recommendations);
    }

    private CarbonFootprintDTO.CarbonAuditResponse mapToAuditResponse(CarbonFootprintEntity e) {
        return mapToAuditResponse(e, null, null, null);
    }

    private CarbonFootprintDTO.CarbonAuditResponse mapToAuditResponse(
            CarbonFootprintEntity e,
            List<CarbonFootprintDTO.EmissionItemDto> emBreakdown,
            List<CarbonFootprintDTO.SequestrationItemDto> seqBreakdown,
            List<String> advice
    ) {
        double netKg = e.getNetCarbonKgCo2() != null ? e.getNetCarbonKgCo2() : 0.0;
        double credits = e.getCarbonCreditsMinted() != null ? e.getCarbonCreditsMinted() : 0.0;
        double monetization = credits * 1850.0;

        String serial = "FV-CARB-" + e.getPeriodYear() + "-F" + e.getFarm().getId() + "-" + (100 + (e.getId() != null ? e.getId() * 37 % 900 : 123));

        if (emBreakdown == null) {
            emBreakdown = List.of(
                    new CarbonFootprintDTO.EmissionItemDto("Diesel Machinery & Pumps", 482.4, 38.0, "🚜", "Deploy solar pumps to eliminate diesel exhaust."),
                    new CarbonFootprintDTO.EmissionItemDto("Synthetic NPK Fertilizer", 580.0, 46.0, "🧪", "Incorporate biochar compost to reduce synthetic nitrogen."),
                    new CarbonFootprintDTO.EmissionItemDto("Grid Electricity", 196.8, 16.0, "⚡", "Grid-tie solar arrays to lower electrical footprint.")
            );
        }

        if (seqBreakdown == null) {
            seqBreakdown = List.of(
                    new CarbonFootprintDTO.SequestrationItemDto("Agroforestry Canopy (Trees)", 1870.0, 32.0, "🌳", "40-year permanent wood biomass sink"),
                    new CarbonFootprintDTO.SequestrationItemDto("Biochar Organic Humus", 2700.0, 46.0, "🧱", "100-year recalcitrant soil black carbon"),
                    new CarbonFootprintDTO.SequestrationItemDto("Solar & Drip Displacement", 1250.0, 22.0, "☀️", "Avoided fossil fuel and fertilizer synthesis")
            );
        }

        if (advice == null) {
            advice = List.of(
                    "Your farm is performing at net-negative carbon sink efficiency!",
                    "Planting 30 more native agroforestry trees along farm bunds will unlock ~0.7 additional carbon credits per season.",
                    "List your verified credits on the FarmVerse Carbon Marketplace to monetize your regenerative practices."
            );
        }

        return CarbonFootprintDTO.CarbonAuditResponse.builder()
                .id(e.getId())
                .farmId(e.getFarm().getId())
                .farmName(e.getFarm().getFarmName())
                .farmLocation(e.getFarm().getLocation() != null ? e.getFarm().getLocation() : "Agricultural District")
                .periodYear(e.getPeriodYear())
                .totalEmissionsKgCo2(e.getTotalEmissionsKgCo2())
                .totalSequestrationKgCo2(e.getTotalSequestrationKgCo2())
                .netCarbonKgCo2(netKg)
                .netCarbonTonnesCo2(Math.round((netKg / 1000.0) * 100.0) / 100.0)
                .isNetNegative(netKg <= 0)
                .carbonCreditsMinted(credits)
                .carbonRating(e.getCarbonRating() != null ? e.getCarbonRating() : "NET_NEGATIVE_A_PLUS")
                .estimatedMonetizationInr(monetization)
                .certificateSerial(serial)
                .emissionsBreakdown(emBreakdown)
                .sequestrationBreakdown(seqBreakdown)
                .actionableRecommendations(advice)
                .createdAt(e.getCreatedAt())
                .build();
    }

    private CarbonFootprintDTO.CarbonCreditListingDto mapToListingDto(CarbonCreditListingEntity l) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        return CarbonFootprintDTO.CarbonCreditListingDto.builder()
                .id(l.getId())
                .farmId(l.getFarm().getId())
                .farmName(l.getFarm().getFarmName())
                .farmerName(l.getFarmer() != null ? l.getFarmer().getFullName() : "Regenerative Farmer")
                .location(l.getFarm().getLocation() != null ? l.getFarm().getLocation() : "India")
                .creditsAvailable(l.getCreditsAvailable())
                .pricePerCreditInr(l.getPricePerCreditInr())
                .totalPriceInr(Math.round(l.getCreditsAvailable() * l.getPricePerCreditInr() * 100.0) / 100.0)
                .certificateSerial(l.getCertificateSerial())
                .status(l.getStatus())
                .carbonRating(l.getFootprint() != null ? l.getFootprint().getCarbonRating() : "NET_NEGATIVE_A_PLUS")
                .createdAt(l.getCreatedAt() != null ? l.getCreatedAt().format(fmt) : "Recent")
                .build();
    }

    private void seedMarketplaceListings() {
        List<Farm> farms = farmRepository.findAll();
        if (farms.isEmpty()) return;

        for (int i = 0; i < Math.min(3, farms.size()); i++) {
            Farm f = farms.get(i);
            User u = f.getFarmer() != null ? f.getFarmer().getUser() : null;

            CarbonFootprintEntity fp = footprintRepository.findLatestByFarmId(f.getId())
                    .orElseGet(() -> {
                        CarbonFootprintEntity newFp = CarbonFootprintEntity.builder()
                                .farm(f)
                                .farmer(u)
                                .periodYear(LocalDateTime.now().getYear())
                                .totalEmissionsKgCo2(1250.0)
                                .totalSequestrationKgCo2(3400.0)
                                .netCarbonKgCo2(-2150.0)
                                .carbonCreditsMinted(2.1)
                                .carbonRating("NET_NEGATIVE_A_PLUS")
                                .createdAt(LocalDateTime.now().minusDays(2))
                                .build();
                        return footprintRepository.save(newFp);
                    });

            CarbonCreditListingEntity listing = CarbonCreditListingEntity.builder()
                    .footprint(fp)
                    .farm(f)
                    .farmer(u)
                    .creditsAvailable(1.5 + (i * 0.8))
                    .pricePerCreditInr(1850.0 + (i * 100.0))
                    .certificateSerial("FV-CARB-2026-F" + f.getId() + "-00" + (i + 1))
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build();

            listingRepository.save(listing);
        }
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
            throw new AccessDeniedException("Access denied: You can only view carbon telemetry for your owned farms.");
        }

        return farm;
    }
}
