package com.classroom.backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonPlanRepository
        extends JpaRepository<LessonPlan, Long> {
}