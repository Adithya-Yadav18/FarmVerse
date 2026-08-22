package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Transient;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore // Prevent infinite JSON loop between Farm and Crop
    private Farm farm;

    @JsonProperty("name") // Frontend expects "name"
    private String cropName;

    private String variety;

    @JsonProperty("plantedDate") // Frontend expects "plantedDate"
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate plantingDate;

    @JsonProperty("expectedHarvestDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate expectedHarvestDate;

    private String status;
    private Double area;
    
    private LocalDateTime createdAt;

    @Transient
    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "Unknown Farm";
    }
}