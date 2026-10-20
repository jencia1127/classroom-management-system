package com.classroom.backend;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);

    Optional<Attendance> findByStudentIdAndAttendanceDate(
            Long studentId, LocalDate attendanceDate);

    long countByStudentId(Long studentId);

    long countByStudentIdAndPresentTrue(Long studentId);
}