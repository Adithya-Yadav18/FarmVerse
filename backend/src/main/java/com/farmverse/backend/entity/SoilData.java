package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "soil_data")
public class SoilData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    private Double phLevel;
    private Double moisture;
    private Double nitrogen;
    private Double phosphorus;
    private Double potassium;
    private Double organicCarbon;
    @Column(columnDefinition = "TEXT")
    private String recommendation; // To store the AI-generated text
    private LocalDateTime recordedAt;

    // NEW: Helper to send farmName directly to the frontend!
    @Transient
    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "Unknown Farm";
    }
}