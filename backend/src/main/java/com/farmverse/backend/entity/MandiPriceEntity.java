package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mandi_prices")
public class MandiPriceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Commodity name: Wheat, Paddy, Tomato, Apple, Cotton, Maize, Onion, Soybean, Sugarcane, Coffee, Tea, etc.
    @Column(nullable = false)
    private String commodity;

    private String variety;

    // Grains, Vegetables, Fruits, Cash Crops, Oilseeds, Spices
    @Column(nullable = false)
    private String category;

    // APMC Mandi Name: e.g. Mysore APMC, Azadpur Mandi, Khanna Mandi, Shimla APMC
    @Column(nullable = false)
    private String mandiName;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String state;

    // Price in ₹ / Quintal (1 Quintal = 100 kg)
    @Column(nullable = false)
    private Double minPrice;

    @Column(nullable = false)
    private Double maxPrice;

    // Most common transaction price
    @Column(nullable = false)
    private Double modalPrice;

    // Official Govt. of India Minimum Support Price (MSP) in ₹ / Quintal
    private Double mspPrice;

    // Daily percentage change: e.g. +2.4%, -1.1%
    @Builder.Default
    private Double priceChangePercent = 0.0;

    // UP, DOWN, STABLE
    @Builder.Default
    private String trend = "STABLE";

    // Daily arrival quantity in Tonnes
    private Double arrivalsTonnes;

    // Geographic latitude and longitude of this APMC Mandi
    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private LocalDate recordedDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
