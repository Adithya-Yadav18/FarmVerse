package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentBookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bookingReference; // e.g. EQB-2026-8941

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private EquipmentEntity equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id")
    private User renter;

    private String renterName;

    private String renterPhone;

    private String deliveryAddress;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer durationUnits; // Number of hours or days

    @Column(nullable = false)
    private String rentalType; // DAILY, HOURLY

    @Column(nullable = false)
    private Double totalRentalAmount;

    @Column(nullable = false)
    private Double securityDeposit;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, APPROVED, REJECTED, ACTIVE, COMPLETED, CANCELLED

    @Builder.Default
    private Boolean withOperator = true;

    @Builder.Default
    private Boolean deliveryRequired = false;

    @Column(columnDefinition = "TEXT")
    private String specialInstructions;

    private LocalDateTime bookedAt;

    private LocalDateTime reviewedAt;

    private String ownerNotes;
}
