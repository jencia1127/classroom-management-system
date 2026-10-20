package com.classroom.backend;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository
        extends JpaRepository<Assignment, Long> {
}