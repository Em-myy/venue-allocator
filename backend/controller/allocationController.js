import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import Venue from "../models/Venue.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [8, 10, 12, 14, 16];

const isFeasible = (course, venue, day, time, currentSchedule) => {
  if (course.expectedStudents > venue.capacity) {
    return false;
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

    await Timetable.deleteMany({});

    let schedule = [];
    let unallocated = [];

    courses.sort((a, b) => b.expectedStudents - a.expectedStudents);

    for (const course of courses) {
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
        schedule.push({
          course: course._id,
          venue: bestSlot.venue._id,
          lecturerId: course.lecturer._id,
          day: bestSlot.day,
          startTime: bestSlot.time,
          endTime: bestSlot.time + course.duration,
        });
      } else {
        unallocated.push(course.code);
      }
    }

    const finalSchedule = schedule.map(({ lecturerId, ...rest }) => rest);
    await Timetable.insertMany(finalSchedule);

    res.status(200).json({
      success: true,
      allocated: schedule.length,
      unallocated: unallocated,
      message:
        unallocated.length > 0
          ? `Completed with conflicts: ${unallocated.join(", ")}`
          : "Timetable generated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
