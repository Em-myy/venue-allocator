import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
import Venue from "../models/Venue.js";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const TIME_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

const isFeasible = (course, venue, day, time, currentSchedule) => {
  if (course.expectedStudents > venue.capacity) {
    return false;
  }

  if (course.requiredResources && course.requiredResources.length > 0) {
    const hadAllResources = course.requiredResources.every((req) =>
      venue.resources.includes(req)
    );

    if (!hadAllResources) {
      return false;
    }
  }

  const newStart = time;
  const newEnd = time + course.duration;

  const venueBusy = currentSchedule.some((t) => {
    if (t.venue.toString() !== venue._id.toString() || t.day !== day) {
      return false;
    }

    return t.startTime < newEnd && t.endTime > newStart;
  });

  if (venueBusy) {
    return false;
  }

  if (!course.lecturer || !course.lecturer._id) {
    return false;
  }

  const lecturerBusy = currentSchedule.some((t) => {
    if (
      t.lecturerId.toString() !== course.lecturer._id.toString() ||
      t.day !== day
    ) {
      return false;
    }
    return t.startTime < newEnd && t.endTime > newStart;
  });

  if (lecturerBusy) {
    return false;
  }

  const lecturer = course.lecturer;

  if (lecturer.preferences?.preferredDays?.length) {
    if (!lecturer.preferences.preferredDays.includes(day)) {
      return false;
    }
  }

  return true;
};

const calculateScore = (course, venue, day, time) => {
  let score = 0;

  const lecturer = course.lecturer;

  if (lecturer.preferences?.preferredTimes?.includes(time.toString())) {
    score += 100;
  }

  const previous = currentSchedule.find(
    (t) => t.lecturerId.toString() === lecturer._id.toString() && t.day === day
  );

  if (previous && previous.endTime === time) {
    score += 50;
  }

  if (venue.capacity > 0) {
    const utilization = course.expectedStudents / venue.capacity;
    score += utilization * 50;
  }

  if (
    venue.resources.length > 0 &&
    (!course.requiredResources || course.requiredResources.length > 0)
  ) {
    score -= 5;
  }

  score += Math.random();
  return score;
};

export const GenerateTimetable = async (req, res) => {
  try {
    const courses = await Course.find().populate("lecturer");
    const venues = await Venue.find();

    if (courses.length === 0 || venues.length === 0) {
      console.log("ABORTING: No courses or venues found.");
      return { generated: [], unallocated: [] };
    }

    await Timetable.deleteMany({});

    let schedule = [];
    let unallocated = [];

    courses.sort(
      (a, b) => (b.expectedStudents || 0) - (a.expectedStudents || 0)
    );

    for (const course of courses) {
      let bestSlot = null;
      let maxScore = -Infinity;

      for (const day of DAYS) {
        for (const time of TIME_SLOTS) {
          for (const venue of venues) {
            if (isFeasible(course, venue, day, time, schedule)) {
              const score = calculateScore(course, venue, day, time);

              if (score > maxScore) {
                maxScore = score;
                bestSlot = { venue, day, time };
              }
            }
          }
        }
      }

      if (bestSlot) {
        schedule.push({
          course: course._id,
          venue: bestSlot.venue._id,
          lecturerId: course.lecturer._id,
          day: bestSlot.day,
          startTime: bestSlot.time,
          endTime: bestSlot.time + course.duration,
        });
      } else {
        unallocated.push(course);
      }
    }

    const finalSchedule = schedule.map(({ lecturerId, ...rest }) => rest);
    const savedTimetable = await Timetable.insertMany(finalSchedule);

    const populatedTimetable = await Timetable.find()
      .populate("course", "title code")
      .populate("venue", "name");

    return {
      generated: populatedTimetable,
      unallocated: unallocated,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const AllocateSingleCourse = async (courseId, existingSchedule) => {
  try {
    const course = await Course.findById(courseId).populate("lecturer");
    if (!course) {
      throw new Error("Course not found");
    }

    const venues = await Venue.find();
    if (venues.length === 0) {
      throw new Error("No venues available");
    }

    let bestSlot = null;
    let maxScore = -Infinity;

    for (const day of DAYS) {
      for (const time of TIME_SLOTS) {
        for (const venue of venues) {
          if (isFeasible(course, venue, day, time, existingSchedule)) {
            const score = calculateScore(course, venue, day, time);

            if (score > maxScore) {
              maxScore = score;
              bestSlot = { venue, day, time };
            }
          }
        }
      }
    }

    if (!bestSlot) {
      throw new Error("Could not find available slot for this course");
    }

    return {
      course: course._id,
      venue: bestSlot.venue._id,
      lecturerId: course.lecturer._id,
      day: bestSlot.day,
      startTime: bestSlot.time,
      endTime: bestSlot.time + course.duration,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
