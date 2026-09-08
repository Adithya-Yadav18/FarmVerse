package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CropRescueDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriggerSosRequest {
        private Long farmId;
        private String cropName;
        private String emergencyType; // CHEMICAL_BURN_TOXICITY, FLOOD_WATERLOGGING, PEST_SWARM_ATTACK, HAILSTORM_PHYSICAL_DAMAGE, SEVERE_DROUGHT_WILT
        private String severityLevel; // CRITICAL_IMMEDIATE, HIGH_24H, MODERATE
        private Double affectedAcres;
        private String cropGrowthStage;
        private String symptomsDescription;
        private String farmerName;
        private String farmerPhone;
        private Double latitude;
        private Double longitude;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FirstAidStepDto {
        private Integer stepNumber;
        private String title;
        private String actionInstruction;
        private String timingUrgency; // "Immediate (0-2 hrs)", "Within 4 hrs", "Next 24 hrs"
        private String caution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PmfbyClaimDossierDto {
        private String claimReference;
        private String farmerName;
        private String farmLocation;
        private Double gpsLatitude;
        private Double gpsLongitude;
        private String affectedCrop;
        private Double claimedAcreage;
        private String disasterEvent;
        private String incidentTimestamp;
        private Double estimatedLossPercent;
        private Double estimatedPayoutInr;
        private String claimStatus; // FAST_TRACK_SUBMITTED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RescueTicketResponse {
        private Long id;
        private String ticketCode;
        private Long farmId;
        private String farmName;
        private String farmerName;
        private String farmerPhone;
        private Double latitude;
        private Double longitude;
        private String emergencyType;
        private String severityLevel;
        private Double affectedAcres;
        private String cropName;
        private String cropGrowthStage;
        private String symptomsDescription;
        private List<FirstAidStepDto> firstAidProtocol;
        private String assignedAgronomistName;
        private String assignedAgronomistPhone;
        private String status;
        private Double estimatedDamagePercent;
        private Double estimatedSalvagePercent;
        private PmfbyClaimDossierDto pmfbyDossier;
        private String resolutionNotes;
        private LocalDateTime triggeredAt;
        private LocalDateTime resolvedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRescueStatusRequest {
        private String status; // ANTIDOTE_DEPLOYED, AGRONOMIST_DISPATCHED, STABILIZED, RESOLVED
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyCategoryPreset {
        private String type;
        private String label;
        private String icon;
        private String defaultSeverity;
        private String typicalSymptoms;
        private String quickAntidoteSummary;
    }
}
