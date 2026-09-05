package com.farmverse.backend.repository;

import com.farmverse.backend.entity.DiseaseDetection;
import com.farmverse.backend.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseaseDetectionRepository extends JpaRepository<DiseaseDetection, Long> {

    List<DiseaseDetection> findByFarmerOrderByDetectedAtDesc(Farmer farmer);

    List<DiseaseDetection> findAllByOrderByDetectedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT d FROM DiseaseDetection d WHERE d.farm.id = :farmId ORDER BY d.detectedAt DESC")
    List<DiseaseDetection> findByFarmIdOrderByDetectedAtDesc(@org.springframework.data.repository.query.Param("farmId") Long farmId);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM DiseaseDetection d WHERE d.crop.id = :cropId ORDER BY d.detectedAt DESC")
    List<DiseaseDetection> findByCropIdOrderByDetectedAtDesc(@org.springframework.data.repository.query.Param("cropId") Long cropId);

    List<DiseaseDetection> findByStatusOrderByDetectedAtDesc(String status);

    long countByStatus(String status);

    long countBySeverity(String severity);
}
