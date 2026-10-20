package com.classroom.backend;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance/report")
public class AttendanceReportController {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public AttendanceReportController(
            StudentRepository studentRepository,
            AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    public List<AttendanceReport> getReport() {
        return studentRepository.findAll().stream()
                .map(student -> {
                    long markedDays = attendanceRepository
                            .countByStudentId(student.getId());

                    long presentDays = attendanceRepository
                            .countByStudentIdAndPresentTrue(student.getId());

                    long absentDays = markedDays - presentDays;

                    Double percentage = markedDays == 0
                            ? null
                            : Math.round(
                                    presentDays * 10000.0 / markedDays) / 100.0;

                    return new AttendanceReport(
                            student.getId(),
                            student.getName(),
                            student.getRollNumber(),
                            markedDays,
                            presentDays,
                            absentDays,
                            percentage);
                })
                .toList();
    }

    public record AttendanceReport(
            Long studentId,
            String name,
            String rollNumber,
            long markedDays,
            long presentDays,
            long absentDays,
            Double percentage) {
    }
}