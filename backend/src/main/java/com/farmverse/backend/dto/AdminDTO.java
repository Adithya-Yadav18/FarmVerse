package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

public class AdminDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserSummaryDto {
        private Long id;
        private String fullName;
        private String email;
        private String role; // e.g. ROLE_FARMER, ROLE_AGRONOMIST, ROLE_ADMIN, ROLE_USER
        private String normalizedRole; // Farmer, Agronomist, Admin, Normal User
        private String phoneNumber;
        private String location;
        private String status; // ACTIVE, SUSPENDED
        private Integer totalFarmsCount;
        private Integer totalCropsCount;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRoleRequest {
        private String role; // ROLE_FARMER, ROLE_AGRONOMIST, ROLE_ADMIN, ROLE_USER
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserStatusRequest {
        private String status; // ACTIVE, SUSPENDED
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserByAdminRequest {
        private String fullName;
        private String email;
        private String password;
        private String role;
        private String phoneNumber;
        private String location;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformStatsDto {
        private Long totalUsers;
        private Long totalFarmers;
        private Long totalAgronomists;
        private Long totalAdmins;
        private Long totalNormalUsers;
        private Long totalFarms;
        private Double totalAcreage;
        private Long totalCropsPlanted;
        private Long totalEquipmentListings;
        private Long totalActiveRescues;
        private Long totalCarbonCreditsTraded;
        private Map<String, Long> roleDistribution;
    }
}
