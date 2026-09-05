package com.farmverse.backend.repository;

import com.farmverse.backend.entity.NotificationEntity;
import com.farmverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findByUserOrderByCreatedAtDesc(User user);

    List<NotificationEntity> findByUserAndReadFalseOrderByCreatedAtDesc(User user);

    long countByUserAndReadFalse(User user);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.read = true WHERE n.user = :user AND n.read = false")
    void markAllAsReadForUser(@Param("user") User user);
}
