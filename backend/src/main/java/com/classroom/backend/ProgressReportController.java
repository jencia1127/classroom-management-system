package com.classroom.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/progress")
public class ProgressReportController {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final GradeRepository gradeRepository;

    public ProgressReportController(
            StudentRepository studentRepository,
            AttendanceRepository attendanceRepository,
            GradeRepository gradeRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.gradeRepository = gradeRepository;
    }

    @GetMapping("/{studentId}")
    public ProgressReport getReport(@PathVariable Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Student not found"));

        long markedDays = attendanceRepository.countByStudentId(studentId);
        long presentDays =
                attendanceRepository.countByStudentIdAndPresentTrue(studentId);
        long absentDays = markedDays - presentDays;

        Double attendancePercentage = markedDays == 0
                ? null
                : round(presentDays * 100.0 / markedDays);

        List<Grade> grades = gradeRepository.findByStudentId(studentId);

        List<AssessmentResult> assessments = grades.stream()
                .map(grade -> {
                    double percentage =
                            grade.getMarksObtained()
                                    / grade.getMaximumMarks() * 100;

                    return new AssessmentResult(
                            grade.getId(),
                            grade.getSubject(),
                            grade.getAssessment(),
                            grade.getMarksObtained(),
                            grade.getMaximumMarks(),
                            round(percentage),
                            letterGrade(percentage));
                })
                .toList();

        double totalObtained = grades.stream()
                .mapToDouble(Grade::getMarksObtained)
                .sum();

        double totalMaximum = grades.stream()
                .mapToDouble(Grade::getMaximumMarks)
                .sum();

        Double overallPercentage = grades.isEmpty()
                ? null
                : totalObtained / totalMaximum * 100;

        return new ProgressReport(
                student.getId(),
                student.getName(),
                student.getRollNumber(),
                student.getEmail(),
                markedDays,
                presentDays,
                absentDays,
                attendancePercentage,
                assessments,
                totalObtained,
                totalMaximum,
                overallPercentage == null
                        ? null : round(overallPercentage),
                overallPercentage == null
                        ? null : letterGrade(overallPercentage));
    }

    private double round(double value) {
        return Math.round(value * 100) / 100.0;
    }

    private String letterGrade(double percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 50) return "D";
        return "F";
    }

    public record AssessmentResult(
            Long id,
            String subject,
            String assessment,
            Double marksObtained,
            Double maximumMarks,
            double percentage,
            String letterGrade) {
    }

    public record ProgressReport(
            Long studentId,
            String name,
            String rollNumber,
            String email,
            long markedDays,
            long presentDays,
            long absentDays,
            Double attendancePercentage,
            List<AssessmentResult> assessments,
            double totalObtained,
            double totalMaximum,
            Double overallPercentage,
            String overallGrade) {
    }
}