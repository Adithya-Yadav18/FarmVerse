package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CropSimulationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropSimulationRepository extends JpaRepository<CropSimulationEntity, Long> {

    List<CropSimulationEntity> findByFarmIdOrderByCreatedAtDesc(Long farmId);

    List<CropSimulationEntity> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    Optional<CropSimulationEntity> findByIdAndFarmerId(Long id, Long farmerId);

    long countByFarmId(Long farmId);
}
