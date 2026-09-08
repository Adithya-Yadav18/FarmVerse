package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "farm_loan_applications")
public class LoanApplicationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String applicationNumber; // e.g. FV-LOAN-2026-1082

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false)
    private String loanType; // "CROP_INPUT", "SOLAR_EQUIPMENT", "POST_HARVEST_STORAGE", "EMERGENCY_RESCUE"

    @Column(nullable = false)
    private Double amountRequested; // INR

    @Column(nullable = false)
    private Integer tenureMonths; // 3 to 36 months

    @Column(nullable = false)
    private Double interestRate; // Annual % e.g. 4.0

    @Column(nullable = false)
    private Double monthlyEmi; // Calculated monthly payment

    @Column(length = 1000)
    private String purpose;

    @Column(nullable = false)
    private String status; // "PENDING", "APPROVED", "DISBURSED", "REJECTED"

    @Column(nullable = false)
    private Integer creditScoreAtApplication;

    private String reviewedBy;

    @Column(length = 2000)
    private String underwritingNotes;

    @Column(nullable = false)
    private LocalDateTime appliedAt;

    private LocalDateTime reviewedAt;
}
