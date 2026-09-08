package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CarbonCreditListingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarbonCreditListingRepository extends JpaRepository<CarbonCreditListingEntity, Long> {

    List<CarbonCreditListingEntity> findByStatusOrderByCreatedAtDesc(String status);

    List<CarbonCreditListingEntity> findByFarmIdOrderByCreatedAtDesc(Long farmId);

    List<CarbonCreditListingEntity> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    Optional<CarbonCreditListingEntity> findByCertificateSerial(String certificateSerial);
}
