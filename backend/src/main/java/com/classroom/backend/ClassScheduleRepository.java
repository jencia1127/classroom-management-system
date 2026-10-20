package com.classroom.backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassScheduleRepository
        extends JpaRepository<ClassSchedule, Long> {
}