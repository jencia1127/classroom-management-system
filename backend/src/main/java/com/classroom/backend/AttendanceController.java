package com.classroom.backend;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public AttendanceController(
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    @GetMapping
    public List<Attendance> getAttendance(
            @RequestParam LocalDate date) {
        return attendanceRepository.findByAttendanceDate(date);
    }

    @PutMapping
    public Attendance saveAttendance(@RequestBody AttendanceRequest request) {
        if (request.studentId() == null
                || request.attendanceDate() == null
                || request.present() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student ID, date and present status are required");
        }

        if (!studentRepository.existsById(request.studentId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Student not found");
        }

        Attendance attendance = attendanceRepository
                .findByStudentIdAndAttendanceDate(
                        request.studentId(), request.attendanceDate())
                .orElseGet(Attendance::new);

        attendance.setStudentId(request.studentId());
        attendance.setAttendanceDate(request.attendanceDate());
        attendance.setPresent(request.present());

        return attendanceRepository.save(attendance);
    }

    public record AttendanceRequest(
            Long studentId,
            LocalDate attendanceDate,
            Boolean present) {
    }
}