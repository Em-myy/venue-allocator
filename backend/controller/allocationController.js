import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
import Venue from "../models/Venue.js";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const TIME_SLOTS = [8, 10, 12, 14, 16, 18];

const isFeasible = (course, venue, day, time, currentSchedule) => {
  if (course.expectedStudents > venue.capacity) {
    console.log(
      `FAIL: Capacity. Course ${course.code} needs ${course.expectedStudents}, Venue ${venue.name} has ${venue.capacity}`
    );
    return false;
  }

  if (course.requiredResources && course.requiredResources.length > 0) {
    const hadAllResources = course.requiredResources.every((req) =>
      venue.resources.includes(req)
    );

    if (!hadAllResources) {
      console.log(
        `FAIL: Resources. Course ${course.code} needs ${course.requiredResources}`
      );
      return false;
    }
  }

  const venueBusy = currentSchedule.some(
    (t) =>
      t.venue.toString() === venue._id.toString() &&
      t.day === day &&
      t.startTime === time
  );

  if (venueBusy) {
    return false;
  }

  if (!course.lecturer || !course.lecturer._id) {
    console.log(
      `CRITICAL ERROR: Course ${course.code} has no lecturer assigned!`
    );
    return false;
  }

  const lecturerBusy = currentSchedule.some(
    (t) =>
      t.lecturerId.toString() === course.lecturer._id.toString() &&
      t.day === day &&
      t.startTime === time
  );

  if (lecturerBusy) {
    return false;
  }

  return true;
};

const calculateScore = (course, day, time) => {
  let score = 0;

  const lecturer = course.lecturer;

  if (lecturer.preferences?.preferredDays?.includes(day)) {
    score += 10;
  }

  if (lecturer.preferences?.preferredTimes?.includes(time.toString())) {
    score += 5;
  }

  return score;
};

export const GenerateTimetable = async (req, res) => {
  try {
    const courses = await Course.find().populate("lecturer");
    const venues = await Venue.find();

    console.log(`--- STARTING GENERATION ---`);
    console.log(`Found ${courses.length} courses`);
    console.log(`Found ${venues.length} venues`);

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
      console.log(
        `Processing: ${course.code} (Students: ${course.expectedStudents})`
      );

      let bestSlot = null;
      let maxScore = -Infinity;

      for (const day of DAYS) {
        for (const time of TIME_SLOTS) {
          for (const venue of venues) {
            if (isFeasible(course, venue, day, time, schedule)) {
              const score = calculateScore(course, day, time);

              if (score > maxScore) {
                maxScore = score;
                bestSlot = { venue, day, time };
              }
            }
          }
        }
      }

      if (bestSlot) {
        console.log(
          `--> ASSIGNED: ${course.code} to ${bestSlot.venue.name} on ${bestSlot.day} at ${bestSlot.time}`
        );
        schedule.push({
          course: course._id,
          venue: bestSlot.venue._id,
          lecturerId: course.lecturer._id,
          day: bestSlot.day,
          startTime: bestSlot.time,
          endTime: bestSlot.time + course.duration,
        });
      } else {
        console.log(`--> FAILED: Could not find slot for ${course.code}`);
        unallocated.push(course.code);
      }
    }

    const finalSchedule = schedule.map(({ lecturerId, ...rest }) => rest);
    const savedTimetable = await Timetable.insertMany(finalSchedule);

    console.log("Timetable generated successfully");
    console.log(
      `DONE. Scheduled: ${schedule.length}, Failed: ${unallocated.length}`
    );

    return {
      generated: savedTimetable,
      unallocated: unallocated,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
