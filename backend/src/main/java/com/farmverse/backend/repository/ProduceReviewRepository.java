package com.farmverse.backend.repository;

import com.farmverse.backend.entity.ProduceReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduceReviewRepository extends JpaRepository<ProduceReviewEntity, Long> {

    @Query("SELECT r FROM ProduceReviewEntity r WHERE r.batch.id = :batchId ORDER BY r.createdAt DESC")
    List<ProduceReviewEntity> findByBatchId(@Param("batchId") Long batchId);

    @Query("SELECT AVG(r.rating) FROM ProduceReviewEntity r WHERE r.batch.id = :batchId")
    Double getAverageRatingForBatch(@Param("batchId") Long batchId);
}
