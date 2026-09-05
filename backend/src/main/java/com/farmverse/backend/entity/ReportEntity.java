package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports")
public class ReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farm_id")
    private Farm farm;

    @Column(nullable = false)
    private String reportTitle;

    @Column(nullable = false)
    private String reportType; // AGRONOMY_COMPREHENSIVE, SOIL_NUTRIENT, DISEASE_SURVEILLANCE, IRRIGATION_EFFICIENCY, CROP_CYCLE_SUMMARY

    private String dateRange;

    @Builder.Default
    private String format = "PDF";

    private String fileSize;

    @Builder.Default
    private String status = "READY"; // READY, GENERATING, FAILED

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Lob
    @Column(name = "pdf_data", columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] pdfData;

    @Builder.Default
    private Integer downloadCount = 0;

    private LocalDateTime generatedAt;

    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "All Farms / Global";
    }

    @JsonProperty("generatedByName")
    public String getGeneratedByName() {
        return user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Agronomist";
    }
}
