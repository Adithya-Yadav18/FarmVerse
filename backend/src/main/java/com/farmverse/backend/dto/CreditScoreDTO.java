package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CreditScoreDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PillarDetail {
        private String key;
        private String name;
        private Double score; // 0 - 100
        private Double weight; // e.g. 0.25 (25%)
        private String grade; // "EXCELLENT", "GOOD", "AVERAGE", "POOR"
        private String telemetryMetric; // e.g. "pH 6.8 • Organic Status: Yes"
        private String impactNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreResponse {
        private Long id;
        private Long farmerId;
        private String farmerName;
        private Long farmId;
        private String farmName;
        private String farmLocation;
        private Integer score; // 300 - 900
        private String tier; // "PRIME_A", "SUPERIOR_B", "STANDARD_C", "HIGH_RISK_D"
        private String tierLabel;
        private Double maxPreApprovedLimit;
        private Boolean kccEligible;
        private Boolean agronomistEndorsed;
        private String agronomistName;
        private String agronomistNotes;
        private Double soilHealthScore;
        private Double satelliteNdviScore;
        private Double harvestTraceabilityScore;
        private Double waterResilienceScore;
        private List<PillarDetail> pillars;
        private List<String> recommendations;
        private LocalDateTime calculatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoanOfferDTO {
        private String id;
        private String title;
        private String category;
        private String description;
        private Double maxAmount;
        private Double interestRateAnnual; // e.g. 4.0% with KCC subvention
        private Boolean kccSubsidized;
        private String tenureRange; // e.g. "6 - 24 Months"
        private List<String> keyBenefits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyLoanRequest {
        private Long farmId;
        private String loanType; // "CROP_INPUT", "SOLAR_EQUIPMENT", "POST_HARVEST_STORAGE", "EMERGENCY_RESCUE"
        private Double amountRequested;
        private Integer tenureMonths;
        private String purpose;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoanApplicationResponse {
        private Long id;
        private String applicationNumber;
        private Long farmerId;
        private String farmerName;
        private Long farmId;
        private String farmName;
        private String farmLocation;
        private String loanType;
        private Double amountRequested;
        private Integer tenureMonths;
        private Double interestRate;
        private Double monthlyEmi;
        private String purpose;
        private String status;
        private Integer creditScoreAtApplication;
        private String reviewedBy;
        private String underwritingNotes;
        private LocalDateTime appliedAt;
        private LocalDateTime reviewedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewLoanRequest {
        private String status; // "APPROVED", "DISBURSED", "REJECTED"
        private String underwritingNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EndorseCreditRequest {
        private String agronomistNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SahayakRequest {
        private String farmerName;
        private String phoneNumber;
        private String village;
        private String assistanceType; // "DOORSTEP_VISIT", "PHONE_CALLBACK"
        private String preferredLanguage; // "Hindi", "Kannada", "Tamil", "English"
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SahayakResponse {
        private String ticketNumber;
        private String assignedOfficer;
        private String officerPhone;
        private String villageKendra;
        private String status;
        private String expectedVisitTime;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KendraCenterDTO {
        private String name;
        private String type; // "CSC Kendra", "Rural Cooperative Bank (PACS)", "NABARD Field Office", "State Bank Agri Branch"
        private String address;
        private String contactPerson;
        private String phone;
        private String distanceKm;
        private String services;
    }
}
