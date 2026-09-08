package com.farmverse.backend.service;

import com.farmverse.backend.dto.CropRescueDTO;
import com.farmverse.backend.entity.CropRescueEntity;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.CropRescueRepository;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CropRescueService {

    private final CropRescueRepository rescueRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        if (rescueRepository.count() == 0) {
            seedDemoRescueTickets();
        }
    }

    @Transactional
    public void seedDemoRescueTickets() {
        log.info("Seeding initial SOS Crop Rescue incident records...");
        User defaultUser = userRepository.findAll().stream().findFirst().orElse(null);

        List<CropRescueDTO.FirstAidStepDto> waterlogSteps = List.of(
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(1)
                        .title("Dig Diagonal 45° Drainage Furrows")
                        .actionInstruction("Immediately trench 1-foot deep runoff channels across the natural slope to evacuate standing water away from the root crowns.")
                        .timingUrgency("Immediate (0-2 hrs)")
                        .caution("Avoid walking in waterlogged root zones to prevent soil compaction.")
                        .build(),
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(2)
                        .title("Foliar Nitrogen & Zinc Restoration")
                        .actionInstruction("Spray 1% Urea (2 kg in 200L water) + 0.5% Zinc Sulphate to counteract severe soil nitrogen leaching and leaf chlorosis.")
                        .timingUrgency("Within 4 hrs")
                        .caution("Do not apply ground fertilizer until soil moisture drops below 70%.")
                        .build(),
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(3)
                        .title("Fungicidal Collar Drenching")
                        .actionInstruction("Drench base of plants with Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold @ 2g/L) to prevent Phytophthora and Pythium root rot.")
                        .timingUrgency("Next 24 hrs")
                        .caution("Ensure spray hits root crown directly.")
                        .build()
        );

        List<CropRescueDTO.FirstAidStepDto> herbicideBurnSteps = List.of(
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(1)
                        .title("Foliar Water Washout Flush")
                        .actionInstruction("Drench foliage thoroughly with clean plain water (800-1000 L/acre) to wash off unabsorbed herbicide residues.")
                        .timingUrgency("Immediate (0-1 hr)")
                        .caution("Use gentle nozzle pressure to avoid tearing stressed leaves.")
                        .build(),
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(2)
                        .title("Cell Detoxification Spray")
                        .actionInstruction("Spray 1.5% Humic Acid + 200 ml liquid seaweed extract per 200L water to stimulate plant antioxidant enzymes and chelate toxic ions.")
                        .timingUrgency("Within 4 hrs")
                        .caution("Do not mix with any other chemical pesticide.")
                        .build(),
                CropRescueDTO.FirstAidStepDto.builder()
                        .stepNumber(3)
                        .title("Activated Carbon / Biochar Drench")
                        .actionInstruction("Apply biochar slurry or fresh cow dung slurry (10 kg in 200L water) along drip line to adsorb active soil-applied herbicide molecules.")
                        .timingUrgency("Next 24 hrs")
                        .caution("Provide light irrigation to activate adsorption.")
                        .build()
        );

        try {
            CropRescueEntity ticket1 = CropRescueEntity.builder()
                    .ticketCode("SOS-2026-4109")
                    .farmId(1L)
                    .farmName("Kaveri Green Acres Plot 4")
                    .farmer(defaultUser)
                    .farmerName("Adithya Yadav")
                    .farmerPhone("+91 98450 11223")
                    .latitude(12.5240)
                    .longitude(76.8980)
                    .emergencyType("FLOOD_WATERLOGGING")
                    .severityLevel("CRITICAL_IMMEDIATE")
                    .affectedAcres(3.5)
                    .cropName("Sugarcane")
                    .cropGrowthStage("Tillering (60 Days)")
                    .symptomsDescription("Sudden 140mm unseasonal rain flooded lower 3.5 acres, root zone completely inundated with yellowing lower leaves.")
                    .firstAidAntidoteJson(objectMapper.writeValueAsString(waterlogSteps))
                    .assignedAgronomistName("Dr. S. K. Narayanaswamy (KVK Mandya)")
                    .assignedAgronomistPhone("+91 94482 11904")
                    .status("ANTIDOTE_DEPLOYED")
                    .estimatedDamagePercent(25.0)
                    .estimatedSalvagePercent(75.0)
                    .claimDossierJson(objectMapper.writeValueAsString(CropRescueDTO.PmfbyClaimDossierDto.builder()
                            .claimReference("PMFBY-INU-2026-9812")
                            .farmerName("Adithya Yadav")
                            .farmLocation("Mandya Rural, Karnataka")
                            .gpsLatitude(12.5240)
                            .gpsLongitude(76.8980)
                            .affectedCrop("Sugarcane")
                            .claimedAcreage(3.5)
                            .disasterEvent("Unseasonal Inundation / Flash Flooding")
                            .incidentTimestamp(LocalDateTime.now().minusHours(6).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .estimatedLossPercent(25.0)
                            .estimatedPayoutInr(42000.0)
                            .claimStatus("FAST_TRACK_SUBMITTED")
                            .build()))
                    .triggeredAt(LocalDateTime.now().minusHours(6))
                    .build();

            CropRescueEntity ticket2 = CropRescueEntity.builder()
                    .ticketCode("SOS-2026-2891")
                    .farmId(2L)
                    .farmName("Mysore Organic Valley")
                    .farmer(defaultUser)
                    .farmerName("Adithya Yadav")
                    .farmerPhone("+91 98450 11223")
                    .latitude(12.3150)
                    .longitude(76.6620)
                    .emergencyType("CHEMICAL_BURN_TOXICITY")
                    .severityLevel("HIGH_24H")
                    .affectedAcres(2.0)
                    .cropName("Tomato")
                    .cropGrowthStage("Vegetative & Early Flowering")
                    .symptomsDescription("Accidental 2,4-D herbicide drift from adjacent field causing cupping and epinasty on tomato shoot tips.")
                    .firstAidAntidoteJson(objectMapper.writeValueAsString(herbicideBurnSteps))
                    .assignedAgronomistName("Dr. Manjula R. (ICAR Agronomist)")
                    .assignedAgronomistPhone("+91 98801 33401")
                    .status("STABILIZED")
                    .estimatedDamagePercent(12.0)
                    .estimatedSalvagePercent(88.0)
                    .claimDossierJson(objectMapper.writeValueAsString(CropRescueDTO.PmfbyClaimDossierDto.builder()
                            .claimReference("PMFBY-TOX-2026-1104")
                            .farmerName("Adithya Yadav")
                            .farmLocation("Mysore Rural, Karnataka")
                            .gpsLatitude(12.3150)
                            .gpsLongitude(76.6620)
                            .affectedCrop("Tomato")
                            .claimedAcreage(2.0)
                            .disasterEvent("Chemical Drift Herbicide Toxicity")
                            .incidentTimestamp(LocalDateTime.now().minusDays(2).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .estimatedLossPercent(12.0)
                            .estimatedPayoutInr(18500.0)
                            .claimStatus("STABILIZED_SETTLED")
                            .build()))
                    .resolutionNotes("Applied Humic Acid foliar flush within 2 hours. New apical buds developing normally. 88% crop successfully salvaged.")
                    .triggeredAt(LocalDateTime.now().minusDays(2))
                    .resolvedAt(LocalDateTime.now().minusHours(12))
                    .build();

            rescueRepository.saveAll(List.of(ticket1, ticket2));
            log.info("SOS Crop Rescue demo incidents seeded successfully.");
        } catch (Exception e) {
            log.error("Failed to seed demo rescue tickets: {}", e.getMessage());
        }
    }

    @Transactional
    public CropRescueDTO.RescueTicketResponse triggerSos(CropRescueDTO.TriggerSosRequest request, User currentUser) {
        String code = "SOS-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000));

        String farmName = "My Farm";
        Double lat = request.getLatitude() != null ? request.getLatitude() : 12.5240;
        Double lng = request.getLongitude() != null ? request.getLongitude() : 76.8980;

        if (request.getFarmId() != null) {
            Optional<Farm> farmOpt = farmRepository.findById(request.getFarmId());
            if (farmOpt.isPresent()) {
                farmName = farmOpt.get().getFarmName();
                lat = farmOpt.get().getLatitude() != null ? farmOpt.get().getLatitude() : lat;
                lng = farmOpt.get().getLongitude() != null ? farmOpt.get().getLongitude() : lng;
            }
        }

        String farmerName = request.getFarmerName() != null ? request.getFarmerName()
                : (currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : "Farmer");
        String farmerPhone = request.getFarmerPhone() != null ? request.getFarmerPhone()
                : (currentUser != null && currentUser.getPhoneNumber() != null ? currentUser.getPhoneNumber() : "+91 98450 00000");

        List<CropRescueDTO.FirstAidStepDto> steps = generateFirstAidProtocol(request.getEmergencyType(), request.getCropName());
        String stepsJson = "[]";
        try {
            stepsJson = objectMapper.writeValueAsString(steps);
        } catch (Exception e) {
            log.warn("Error serializing first aid steps: {}", e.getMessage());
        }

        // Assigned Agronomist
        String agronomistName = "Dr. S. K. Narayanaswamy (KVK Mandya Officer)";
        String agronomistPhone = "+91 94482 11904";

        double damageEst = request.getSeverityLevel().equalsIgnoreCase("CRITICAL_IMMEDIATE") ? 35.0 : 18.0;
        double salvageEst = 100.0 - damageEst;

        // PMFBY Fast-track Claim Dossier
        String claimRef = "PMFBY-" + LocalDate.now().getYear() + "-" + (10000 + new Random().nextInt(90000));
        double estPayout = (request.getAffectedAcres() != null ? request.getAffectedAcres() : 2.0) * damageEst * 350.0;

        CropRescueDTO.PmfbyClaimDossierDto dossier = CropRescueDTO.PmfbyClaimDossierDto.builder()
                .claimReference(claimRef)
                .farmerName(farmerName)
                .farmLocation(farmName)
                .gpsLatitude(lat)
                .gpsLongitude(lng)
                .affectedCrop(request.getCropName())
                .claimedAcreage(request.getAffectedAcres() != null ? request.getAffectedAcres() : 2.0)
                .disasterEvent(formatDisasterEvent(request.getEmergencyType()))
                .incidentTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .estimatedLossPercent(damageEst)
                .estimatedPayoutInr((double) Math.round(estPayout))
                .claimStatus("FAST_TRACK_SUBMITTED")
                .build();

        String dossierJson = "{}";
        try {
            dossierJson = objectMapper.writeValueAsString(dossier);
        } catch (Exception e) {
            log.warn("Error serializing dossier: {}", e.getMessage());
        }

        CropRescueEntity entity = CropRescueEntity.builder()
                .ticketCode(code)
                .farmId(request.getFarmId())
                .farmName(farmName)
                .farmer(currentUser)
                .farmerName(farmerName)
                .farmerPhone(farmerPhone)
                .latitude(lat)
                .longitude(lng)
                .emergencyType(request.getEmergencyType().toUpperCase())
                .severityLevel(request.getSeverityLevel() != null ? request.getSeverityLevel().toUpperCase() : "CRITICAL_IMMEDIATE")
                .affectedAcres(request.getAffectedAcres() != null ? request.getAffectedAcres() : 1.0)
                .cropName(request.getCropName())
                .cropGrowthStage(request.getCropGrowthStage() != null ? request.getCropGrowthStage() : "Vegetative")
                .symptomsDescription(request.getSymptomsDescription())
                .firstAidAntidoteJson(stepsJson)
                .assignedAgronomistName(agronomistName)
                .assignedAgronomistPhone(agronomistPhone)
                .status("SOS_TRIGGERED")
                .estimatedDamagePercent(damageEst)
                .estimatedSalvagePercent(salvageEst)
                .claimDossierJson(dossierJson)
                .triggeredAt(LocalDateTime.now())
                .build();

        CropRescueEntity saved = rescueRepository.save(entity);
        return toTicketResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CropRescueDTO.RescueTicketResponse> getMyTickets(User currentUser) {
        List<CropRescueEntity> list = rescueRepository.findAll();
        if (currentUser != null) {
            List<CropRescueEntity> userList = rescueRepository.findByFarmerIdOrderByTriggeredAtDesc(currentUser.getId());
            if (!userList.isEmpty()) {
                list = userList;
            }
        }
        return list.stream().map(this::toTicketResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CropRescueDTO.RescueTicketResponse getTicketById(Long id) {
        CropRescueEntity entity = rescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rescue ticket not found with ID: " + id));
        return toTicketResponse(entity);
    }

    @Transactional
    public CropRescueDTO.RescueTicketResponse updateStatus(Long id, CropRescueDTO.UpdateRescueStatusRequest req) {
        CropRescueEntity entity = rescueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rescue ticket not found with ID: " + id));

        entity.setStatus(req.getStatus().toUpperCase());
        if (req.getNotes() != null) {
            entity.setResolutionNotes(req.getNotes());
        }
        if ("STABILIZED".equalsIgnoreCase(req.getStatus()) || "RESOLVED".equalsIgnoreCase(req.getStatus())) {
            entity.setResolvedAt(LocalDateTime.now());
        }

        CropRescueEntity updated = rescueRepository.save(entity);
        return toTicketResponse(updated);
    }

    public List<CropRescueDTO.EmergencyCategoryPreset> getEmergencyPresets() {
        return List.of(
                CropRescueDTO.EmergencyCategoryPreset.builder()
                        .type("CHEMICAL_BURN_TOXICITY")
                        .label("Chemical Burn / Herbicide Overdose")
                        .icon("🧪")
                        .defaultSeverity("CRITICAL_IMMEDIATE")
                        .typicalSymptoms("Leaves curling, sudden scorch marks, yellow halos within hours of spraying.")
                        .quickAntidoteSummary("Immediate plain water wash + 1.5% Humic Acid foliar detox.")
                        .build(),

                CropRescueDTO.EmergencyCategoryPreset.builder()
                        .type("FLOOD_WATERLOGGING")
                        .label("Flash Flood / Severe Waterlogging")
                        .icon("🌊")
                        .defaultSeverity("CRITICAL_IMMEDIATE")
                        .typicalSymptoms("Standing water over 2 inches, oxygen starvation at roots, wilting despite wet soil.")
                        .quickAntidoteSummary("Emergency 45° herringbone furrows + 1% Urea foliar spray.")
                        .build(),

                CropRescueDTO.EmergencyCategoryPreset.builder()
                        .type("PEST_SWARM_ATTACK")
                        .label("Swarm Pest Attack (Armyworm/Locust)")
                        .icon("🦗")
                        .defaultSeverity("CRITICAL_IMMEDIATE")
                        .typicalSymptoms("Foliage consumed rapidly overnight, skeletonized leaves, droppings at whorl.")
                        .quickAntidoteSummary("Perimeter barrier trench with Chlorpyrifos DP + Emamectin Benzoate.")
                        .build(),

                CropRescueDTO.EmergencyCategoryPreset.builder()
                        .type("HAILSTORM_PHYSICAL_DAMAGE")
                        .label("Hailstorm & Mechanical Tissue Damage")
                        .icon("🧊")
                        .defaultSeverity("HIGH_24H")
                        .typicalSymptoms("Shredded leaves, broken stems, stripped flowers from sudden hailstones.")
                        .quickAntidoteSummary("Immediate Copper Oxychloride spray to seal bacterial infection entry.")
                        .build(),

                CropRescueDTO.EmergencyCategoryPreset.builder()
                        .type("SEVERE_DROUGHT_WILT")
                        .label("Sudden Drought / Extreme Heat Wilt")
                        .icon("☀️")
                        .defaultSeverity("HIGH_24H")
                        .typicalSymptoms("Stems drooping, permanent wilting point approaching, leaf scorch.")
                        .quickAntidoteSummary("1% Potassium Nitrate anti-transpirant spray + root mulching.")
                        .build()
        );
    }

    // --- Helpers ---

    private List<CropRescueDTO.FirstAidStepDto> generateFirstAidProtocol(String emergencyType, String crop) {
        String type = emergencyType != null ? emergencyType.toUpperCase() : "CHEMICAL_BURN_TOXICITY";

        switch (type) {
            case "FLOOD_WATERLOGGING":
                return List.of(
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(1)
                                .title("Surface Drainage Furrows")
                                .actionInstruction("Excavate 45-degree angled exit furrows along lowest field gradient to discharge standing water away from " + crop + " roots within 3 hours.")
                                .timingUrgency("Immediate (0-2 hrs)")
                                .caution("Do not walk extensively in wet furrows to prevent root tearing.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(2)
                                .title("Foliar Nutrient Resupply")
                                .actionInstruction("Spray 1% Urea (10g/L) + 0.5% Zinc Sulphate to counteract nitrogen wash-out and leaf chlorosis.")
                                .timingUrgency("Within 4 hrs")
                                .caution("Spray strictly on foliage, do not apply to waterlogged soil.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(3)
                                .title("Anti-Rot Fungicide Drench")
                                .actionInstruction("Drench root zone with Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold @ 2g/L) to prevent Phytophthora collar rot.")
                                .timingUrgency("Next 24 hrs")
                                .caution("Ensure drenching covers base of all affected plants.")
                                .build()
                );

            case "PEST_SWARM_ATTACK":
                return List.of(
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(1)
                                .title("Perimeter Defense Trench")
                                .actionInstruction("Dig a 1-foot shallow trench around affected field border and dust with Chlorpyrifos 1.5% DP or Methyl Parathion dust.")
                                .timingUrgency("Immediate (0-2 hrs)")
                                .caution("Wear protective gloves and mask when applying dust barrier.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(2)
                                .title("Targeted Biological Knockdown")
                                .actionInstruction("Spray Emamectin Benzoate 5% SG @ 80g/acre or Spinetoram 11.7% SC @ 100 ml/acre into plant whorls.")
                                .timingUrgency("Within 4 hrs")
                                .caution("Apply during twilight/evening when armyworm larvae feed actively.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(3)
                                .title("Anti-Feeding Bio-Deterrent")
                                .actionInstruction("Spray Azadirachtin 10,000 ppm (Neem oil) @ 2 ml/L to inhibit surviving pests from consuming remaining foliage.")
                                .timingUrgency("Next 24 hrs")
                                .caution("Ensure full canopy coverage.")
                                .build()
                );

            case "HAILSTORM_PHYSICAL_DAMAGE":
                return List.of(
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(1)
                                .title("Wound Antiseptic Spray")
                                .actionInstruction("Spray Copper Oxychloride 50% WP (2.5g/L) + Streptocycline (1g in 10L) within 6 hours to prevent bacterial entry into lacerated plant tissues.")
                                .timingUrgency("Immediate (0-6 hrs)")
                                .caution("Do not delay; bacteria enter open tissue tears within 12 hours.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(2)
                                .title("Cell Growth Stimulant")
                                .actionInstruction("Apply Gibberellic Acid (GA3 @ 10 ppm) + 19:19:19 soluble fertilizer to stimulate dormant secondary buds.")
                                .timingUrgency("Within 48 hrs")
                                .caution("Ensure plant has adequate soil moisture before spraying stimulants.")
                                .build()
                );

            case "SEVERE_DROUGHT_WILT":
                return List.of(
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(1)
                                .title("Anti-Transpirant Foliar Application")
                                .actionInstruction("Spray 1% Potassium Nitrate (KNO3 @ 10g/L) to induce immediate stomatal closure and preserve internal leaf turgidity.")
                                .timingUrgency("Immediate (0-2 hrs)")
                                .caution("Spray early morning before intense sunlight.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(2)
                                .title("Root Zone Straw Mulching")
                                .actionInstruction("Spread 4-inch layer of paddy straw or crop residue around base to insulate roots and reduce soil evaporation by 60%.")
                                .timingUrgency("Within 6 hrs")
                                .caution("Keep mulch 2 inches away from main stem to prevent pest harboring.")
                                .build()
                );

            default: // CHEMICAL_BURN_TOXICITY
                return List.of(
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(1)
                                .title("Foliar Washout Flush")
                                .actionInstruction("Drench foliage thoroughly with clean plain water (800-1000 L/acre) to wash off unabsorbed herbicide residues.")
                                .timingUrgency("Immediate (0-1 hr)")
                                .caution("Use fine mist to prevent tearing chemical-weakened leaf cuticles.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(2)
                                .title("Cell Detoxification Spray")
                                .actionInstruction("Spray 1.5% Humic Acid + 200 ml liquid seaweed extract per 200L water to stimulate plant antioxidant enzymes and chelate toxic ions.")
                                .timingUrgency("Within 4 hrs")
                                .caution("Do not mix with any other chemical pesticide.")
                                .build(),
                        CropRescueDTO.FirstAidStepDto.builder()
                                .stepNumber(3)
                                .title("Activated Carbon / Biochar Drench")
                                .actionInstruction("Apply biochar slurry or fresh cow dung slurry (10 kg in 200L water) along drip line to adsorb active soil-applied herbicide molecules.")
                                .timingUrgency("Next 24 hrs")
                                .caution("Provide light irrigation to activate adsorption.")
                                .build()
                );
        }
    }

    private String formatDisasterEvent(String type) {
        if (type == null) return "Acute Crop Disaster";
        switch (type.toUpperCase()) {
            case "FLOOD_WATERLOGGING": return "Unseasonal Inundation / Flash Flooding";
            case "CHEMICAL_BURN_TOXICITY": return "Chemical Drift & Herbicide Phytotoxicity";
            case "PEST_SWARM_ATTACK": return "Invasive Swarm Pest / Armyworm Attack";
            case "HAILSTORM_PHYSICAL_DAMAGE": return "Severe Hailstorm & Mechanical Crop Damage";
            case "SEVERE_DROUGHT_WILT": return "Acute Drought & Heat Wave Wilt";
            default: return type.replace('_', ' ');
        }
    }

    private CropRescueDTO.RescueTicketResponse toTicketResponse(CropRescueEntity entity) {
        List<CropRescueDTO.FirstAidStepDto> steps = new ArrayList<>();
        if (entity.getFirstAidAntidoteJson() != null) {
            try {
                steps = objectMapper.readValue(entity.getFirstAidAntidoteJson(), new TypeReference<List<CropRescueDTO.FirstAidStepDto>>() {});
            } catch (Exception e) {
                log.warn("Error deserializing first aid steps: {}", e.getMessage());
            }
        }

        CropRescueDTO.PmfbyClaimDossierDto dossier = null;
        if (entity.getClaimDossierJson() != null) {
            try {
                dossier = objectMapper.readValue(entity.getClaimDossierJson(), CropRescueDTO.PmfbyClaimDossierDto.class);
            } catch (Exception e) {
                log.warn("Error deserializing dossier: {}", e.getMessage());
            }
        }

        return CropRescueDTO.RescueTicketResponse.builder()
                .id(entity.getId())
                .ticketCode(entity.getTicketCode())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarmName())
                .farmerName(entity.getFarmerName())
                .farmerPhone(entity.getFarmerPhone())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .emergencyType(entity.getEmergencyType())
                .severityLevel(entity.getSeverityLevel())
                .affectedAcres(entity.getAffectedAcres())
                .cropName(entity.getCropName())
                .cropGrowthStage(entity.getCropGrowthStage())
                .symptomsDescription(entity.getSymptomsDescription())
                .firstAidProtocol(steps)
                .assignedAgronomistName(entity.getAssignedAgronomistName())
                .assignedAgronomistPhone(entity.getAssignedAgronomistPhone())
                .status(entity.getStatus())
                .estimatedDamagePercent(entity.getEstimatedDamagePercent())
                .estimatedSalvagePercent(entity.getEstimatedSalvagePercent())
                .pmfbyDossier(dossier)
                .resolutionNotes(entity.getResolutionNotes())
                .triggeredAt(entity.getTriggeredAt())
                .resolvedAt(entity.getResolvedAt())
                .build();
    }
}
