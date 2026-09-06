package com.farmverse.backend.repository;

import com.farmverse.backend.entity.MandiPriceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MandiPriceRepository extends JpaRepository<MandiPriceEntity, Long> {

    List<MandiPriceEntity> findByCommodityIgnoreCaseOrderByModalPriceDesc(String commodity);

    List<MandiPriceEntity> findByCategoryIgnoreCaseOrderByModalPriceDesc(String category);

    List<MandiPriceEntity> findByStateIgnoreCaseOrderByModalPriceDesc(String state);

    List<MandiPriceEntity> findAllByOrderByModalPriceDesc();

    @Query("SELECT m FROM MandiPriceEntity m WHERE " +
            "LOWER(m.commodity) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.mandiName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.district) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.state) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY m.modalPrice DESC")
    List<MandiPriceEntity> searchMandiPrices(@Param("query") String query);

    @Query("SELECT DISTINCT m.commodity FROM MandiPriceEntity m ORDER BY m.commodity ASC")
    List<String> findDistinctCommodities();

    @Query("SELECT DISTINCT m.state FROM MandiPriceEntity m ORDER BY m.state ASC")
    List<String> findDistinctStates();

    @Query("SELECT COUNT(DISTINCT m.mandiName) FROM MandiPriceEntity m")
    long countDistinctMandis();
}
