package com.farmverse.backend.repository;

import com.farmverse.backend.entity.CreditScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditScoreRepository extends JpaRepository<CreditScoreEntity, Long> {

    Optional<CreditScoreEntity> findTopByFarmerIdOrderByCalculatedAtDesc(Long farmerId);

    Optional<CreditScoreEntity> findTopByFarmIdOrderByCalculatedAtDesc(Long farmId);

    List<CreditScoreEntity> findAllByOrderByCalculatedAtDesc();
}
