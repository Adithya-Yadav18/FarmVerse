package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "carbon_credit_listings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarbonCreditListingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "footprint_id", nullable = false)
    private CarbonFootprintEntity footprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    @Column(nullable = false)
    private Double creditsAvailable;

    @Column(nullable = false)
    private Double pricePerCreditInr;

    @Column(nullable = false, unique = true)
    private String certificateSerial;

    @Column(nullable = false)
    private String status; // ACTIVE, SOLD, RETIRED

    private String buyerName;

    private String buyerEmail;

    private String buyerOrganization;

    private LocalDateTime purchasedAt;

    private LocalDateTime createdAt;
}
