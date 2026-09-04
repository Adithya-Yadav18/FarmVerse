package com.farmverse.backend.repository;

import com.farmverse.backend.entity.DiseaseTreatmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseaseTreatmentLogRepository extends JpaRepository<DiseaseTreatmentLog, Long> {

    List<DiseaseTreatmentLog> findByDiseaseDetectionIdOrderByTreatmentDateAsc(Long detectionId);

    List<DiseaseTreatmentLog> findByDiseaseDetectionIdOrderByTreatmentDateDesc(Long detectionId);

    long countByDiseaseDetectionId(Long detectionId);

    void deleteByDiseaseDetectionId(Long detectionId);
}
