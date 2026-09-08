package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CarbonFootprintEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarbonFootprintRepository extends JpaRepository<CarbonFootprintEntity, Long> {

    @Query("SELECT c FROM CarbonFootprintEntity c WHERE c.farm.id = :farmId ORDER BY c.createdAt DESC")
    List<CarbonFootprintEntity> findByFarmIdOrderByCreatedAtDesc(@Param("farmId") Long farmId);

    default Optional<CarbonFootprintEntity> findLatestByFarmId(Long farmId) {
        List<CarbonFootprintEntity> list = findByFarmIdOrderByCreatedAtDesc(farmId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    List<CarbonFootprintEntity> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    long countByFarmId(Long farmId);
}
