package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CarbonFootprintDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonAuditRequest {
        private Long farmId;
        private Double dieselUsageLiters;
        private Double syntheticFertilizerKg;
        private Double electricityKwh;
        private String tillageMethod; // CONVENTIONAL, REDUCED, NO_TILL
        private Boolean stubbleBurningAvoided;
        private Boolean solarPumpInstalled;
        private Boolean dripIrrigationActive;
        private Double biocharCompostTons;
        private Integer agroforestryTreesCount;
        private Double coverCroppingAcres;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmissionItemDto {
        private String sourceName;
        private Double amountKgCo2;
        private Double percentOfTotal;
        private String icon;
        private String mitigationTip;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SequestrationItemDto {
        private String practiceName;
        private Double amountKgCo2;
        private Double percentOfTotal;
        private String icon;
        private String permanenceYears;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonAuditResponse {
        private Long id;
        private Long farmId;
        private String farmName;
        private String farmLocation;
        private Integer periodYear;
        private Double totalEmissionsKgCo2;
        private Double totalSequestrationKgCo2;
        private Double netCarbonKgCo2;
        private Double netCarbonTonnesCo2;
        private Boolean isNetNegative;
        private Double carbonCreditsMinted;
        private String carbonRating; // NET_NEGATIVE_A_PLUS, LOW_CARBON_A, BALANCED_B, INTENSIVE_C
        private Double estimatedMonetizationInr;
        private String certificateSerial;
        private List<EmissionItemDto> emissionsBreakdown;
        private List<SequestrationItemDto> sequestrationBreakdown;
        private List<String> actionableRecommendations;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonCreditListingDto {
        private Long id;
        private Long farmId;
        private String farmName;
        private String farmerName;
        private String location;
        private Double creditsAvailable;
        private Double pricePerCreditInr;
        private Double totalPriceInr;
        private String certificateSerial;
        private String status; // ACTIVE, SOLD, RETIRED
        private String carbonRating;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListCreditsRequest {
        private Long farmId;
        private Double creditsToList;
        private Double pricePerCreditInr;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyCreditRequest {
        private Double creditsToBuy;
        private String buyerName;
        private String buyerEmail;
        private String buyerOrganization;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateReceiptDto {
        private String certificateSerial;
        private String farmName;
        private String farmerName;
        private String location;
        private Double creditsRetired;
        private Double co2OffsetTonnes;
        private String buyerName;
        private String buyerOrganization;
        private String issuedAt;
        private String verificationHash;
    }
}
