package com.farmverse.backend.repository;

import com.farmverse.backend.entity.ReportEntity;
import com.farmverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    List<ReportEntity> findByUserOrderByGeneratedAtDesc(User user);

    List<ReportEntity> findAllByOrderByGeneratedAtDesc();

    List<ReportEntity> findByUserAndReportTypeOrderByGeneratedAtDesc(User user, String reportType);

    List<ReportEntity> findAllByReportTypeOrderByGeneratedAtDesc(String reportType);

    long countByUser(User user);

    long countByReportType(String reportType);
}
