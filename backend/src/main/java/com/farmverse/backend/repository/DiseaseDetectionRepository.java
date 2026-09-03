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

    List<DiseaseDetection> findByFarmIdOrderByDetectedAtDesc(Long farmId);

    List<DiseaseDetection> findByCropIdOrderByDetectedAtDesc(Long cropId);

    List<DiseaseDetection> findByStatusOrderByDetectedAtDesc(String status);

    long countByStatus(String status);

    long countBySeverity(String severity);
}
