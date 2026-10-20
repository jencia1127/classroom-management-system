package com.classroom.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/schedules")
public class ClassScheduleController {

    private final ClassScheduleRepository scheduleRepository;

    public ClassScheduleController(
            ClassScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @GetMapping
    public List<ClassSchedule> getSchedules() {
        return scheduleRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassSchedule addSchedule(@RequestBody ClassSchedule details) {
        ClassSchedule schedule = new ClassSchedule();
        copyDetails(details, schedule);
        return scheduleRepository.save(schedule);
    }

    @PutMapping("/{id}")
    public ClassSchedule updateSchedule(
            @PathVariable Long id,
            @RequestBody ClassSchedule details) {
        ClassSchedule schedule = findSchedule(id);
        copyDetails(details, schedule);
        return scheduleRepository.save(schedule);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSchedule(@PathVariable Long id) {
        scheduleRepository.delete(findSchedule(id));
    }

    private ClassSchedule findSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Class schedule not found"));
    }

    private void copyDetails(
            ClassSchedule source,
            ClassSchedule target) {
        if (source.getSubject() == null
                || source.getSubject().isBlank()
                || source.getDayOfWeek() == null
                || source.getStartTime() == null
                || source.getEndTime() == null
                || source.getRoom() == null
                || source.getRoom().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject, day, start time, end time and room are required");
        }

        if (!source.getEndTime().isAfter(source.getStartTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End time must be later than start time");
        }

        String subject = source.getSubject().trim();
        String room = source.getRoom().trim();

        if (subject.length() > 255 || room.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Subject and room allow up to 255 characters");
        }

        target.setSubject(subject);
        target.setDayOfWeek(source.getDayOfWeek());
        target.setStartTime(source.getStartTime());
        target.setEndTime(source.getEndTime());
        target.setRoom(room);
    }
}