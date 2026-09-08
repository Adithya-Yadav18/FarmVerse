package com.farmverse.backend.repository;

import com.farmverse.backend.entity.ProduceBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProduceBatchRepository extends JpaRepository<ProduceBatchEntity, Long> {

    Optional<ProduceBatchEntity> findByBatchCode(String batchCode);

    @Query("SELECT b FROM ProduceBatchEntity b WHERE b.farm.id = :farmId ORDER BY b.createdAt DESC")
    List<ProduceBatchEntity> findByFarmId(@Param("farmId") Long farmId);

    @Query("SELECT b FROM ProduceBatchEntity b WHERE b.farmer.id = :farmerId ORDER BY b.createdAt DESC")
    List<ProduceBatchEntity> findByFarmerId(@Param("farmerId") Long farmerId);

    List<ProduceBatchEntity> findAllByOrderByCreatedAtDesc();

    @Query("SELECT b FROM ProduceBatchEntity b WHERE " +
           "LOWER(b.commodity) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.batchCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.farm.farmName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.status) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY b.createdAt DESC")
    List<ProduceBatchEntity> searchBatches(@Param("query") String query);

    long countByStatus(String status);

    long countByFarmingPracticeContainingIgnoreCase(String keyword);
}
