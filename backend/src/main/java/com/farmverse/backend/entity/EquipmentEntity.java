package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "farm_equipment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // TRACTOR, COMBINE_HARVESTER, DRONE_SPRAYER, ROTAVATOR, LASER_LEVELER, BALER, SEED_DRILL, WATER_PUMP

    @Column(nullable = false)
    private String brand; // Mahindra, John Deere, Kubota, DJI, Shaktiman, Sonalika, Trimble

    private Integer horsepower; // e.g. 50 HP

    private String fuelType; // DIESEL, ELECTRIC, SOLAR, PETROL

    @Column(nullable = false)
    private Double hourlyRate; // INR/hr

    @Column(nullable = false)
    private Double dailyRate; // INR/day

    @Column(nullable = false)
    private Double securityDeposit; // INR

    @Column(nullable = false)
    @Builder.Default
    private Boolean operatorIncluded = true; // Trained driver/operator provided

    private String conditionStatus; // EXCELLENT, GOOD, FAIR

    @Column(nullable = false)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, RENTED, MAINTENANCE

    @Column(nullable = false)
    private String locationName; // District / Taluk e.g. "Mandya, Karnataka"

    private Double latitude;

    private Double longitude;

    private String ownerName;

    private String ownerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(length = 1000)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String specsJson; // Key specifications e.g. working width, tank capacity, gear shifts

    @Builder.Default
    private Double rating = 4.8;

    @Builder.Default
    private Integer totalRentalsCount = 12;

    private LocalDateTime createdAt;
}
