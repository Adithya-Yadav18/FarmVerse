package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CropRecommendationEntity;
import com.farmverse.backend.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CropRecommendationRepository extends JpaRepository<CropRecommendationEntity, Long> {

    List<CropRecommendationEntity> findByFarmOrderBySuitabilityScoreDesc(Farm farm);

    @Query("SELECT c FROM CropRecommendationEntity c WHERE c.farm.id = :farmId ORDER BY c.suitabilityScore DESC")
    List<CropRecommendationEntity> findByFarmIdOrderBySuitabilityScoreDesc(@Param("farmId") Long farmId);

    @Transactional
    void deleteByFarm(Farm farm);

    @Modifying
    @Transactional
    @Query("DELETE FROM CropRecommendationEntity c WHERE c.farm.id = :farmId")
    void deleteByFarmId(@Param("farmId") Long farmId);
}
