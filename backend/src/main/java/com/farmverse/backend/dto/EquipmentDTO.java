package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EquipmentDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentItemDto {
        private Long id;
        private String name;
        private String category;
        private String brand;
        private Integer horsepower;
        private String fuelType;
        private Double hourlyRate;
        private Double dailyRate;
        private Double securityDeposit;
        private Boolean operatorIncluded;
        private String conditionStatus;
        private String status;
        private String locationName;
        private Double latitude;
        private Double longitude;
        private Double distanceKm; // Calculated based on user/farm coords
        private String ownerName;
        private String ownerPhone;
        private Long ownerId;
        private String imageUrl;
        private String description;
        private String specsJson;
        private Double rating;
        private Integer totalRentalsCount;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEquipmentRequest {
        private String name;
        private String category;
        private String brand;
        private Integer horsepower;
        private String fuelType;
        private Double hourlyRate;
        private Double dailyRate;
        private Double securityDeposit;
        private Boolean operatorIncluded;
        private String conditionStatus;
        private String locationName;
        private Double latitude;
        private Double longitude;
        private String ownerName;
        private String ownerPhone;
        private String imageUrl;
        private String description;
        private String specsJson;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingRequest {
        private Long equipmentId;
        private String renterName;
        private String renterPhone;
        private String deliveryAddress;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer durationUnits; // Hours or Days
        private String rentalType; // DAILY, HOURLY
        private Boolean withOperator;
        private Boolean deliveryRequired;
        private String specialInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingDto {
        private Long id;
        private String bookingReference;
        private Long equipmentId;
        private String equipmentName;
        private String equipmentCategory;
        private String equipmentBrand;
        private String equipmentImageUrl;
        private String equipmentLocation;
        private Long renterId;
        private String renterName;
        private String renterPhone;
        private String deliveryAddress;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer durationUnits;
        private String rentalType;
        private Double totalRentalAmount;
        private Double securityDeposit;
        private String status;
        private Boolean withOperator;
        private Boolean deliveryRequired;
        private String specialInstructions;
        private LocalDateTime bookedAt;
        private LocalDateTime reviewedAt;
        private String ownerNotes;
        private String ownerName;
        private String ownerPhone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBookingStatusRequest {
        private String status; // APPROVED, REJECTED, ACTIVE, COMPLETED, CANCELLED
        private String notes;
    }
}
