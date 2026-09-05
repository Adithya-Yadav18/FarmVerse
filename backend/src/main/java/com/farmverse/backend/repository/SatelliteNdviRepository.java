package com.farmverse.backend.repository;

import com.farmverse.backend.entity.SatelliteNdviEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SatelliteNdviRepository extends JpaRepository<SatelliteNdviEntity, Long> {

    @Query("SELECT s FROM SatelliteNdviEntity s WHERE s.farm.id = :farmId ORDER BY s.captureDate DESC")
    List<SatelliteNdviEntity> findByFarmIdOrderByCaptureDateDesc(@Param("farmId") Long farmId);

    @Query("SELECT s FROM SatelliteNdviEntity s WHERE s.farm.id = :farmId ORDER BY s.captureDate DESC LIMIT 1")
    Optional<SatelliteNdviEntity> findLatestByFarmId(@Param("farmId") Long farmId);

    @Query("SELECT s FROM SatelliteNdviEntity s WHERE s.farm.farmer.user.email = :email ORDER BY s.captureDate DESC")
    List<SatelliteNdviEntity> findByFarmerEmailOrderByCaptureDateDesc(@Param("email") String email);

    List<SatelliteNdviEntity> findAllByOrderByCaptureDateDesc();

    @Query("SELECT COUNT(s) FROM SatelliteNdviEntity s WHERE s.anomalyDetected = true")
    long countAnomalies();
}
