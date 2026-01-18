import Course from "../models/Course.js";
import Timetable from "../models/Timetable.js";
import Venue from "../models/Venue.js";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const TIME_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

const WEIGHTS = {
  LECTURER_PREF_TIME: 2000, // Big bonus if lecturer gets their time
  LECTURER_PREF_DAY: 1500, // Bonus for preferred day
  VENUE_UTILIZATION: 1000, // Bonus for filling a room to capacity (0-1000)
  RESOURCE_WASTE: -300, // Penalty for using a Lab for a normal lecture
  CROWDING_PENALTY: -50, // Penalty for busy slots (spreads classes out)
  SAME_DAY_LOAD: -50, // Penalty if venue is used too much in one day
};

const getId = (field) => {
  if (!field) return null;
  if (typeof field === "string") return field;
  if (field._id) return field._id.toString();
  return field.toString();
};

const isFeasible = (course, venue, day, time, currentSchedule) => {
  if (course.expectedStudents > Number(venue.capacity)) {
    return false;
  }

  const DAY_START = 8;
  const DAY_END = 18;

  if (time < DAY_START || time + course.duration > DAY_END) {
    return false;
  }

  if (course.venueType && venue.type !== course.venueType) {
    return false;
  }

  if (course.requiredResources && course.requiredResources.length > 0) {
    const hadAllResources = course.requiredResources.every((req) =>
      venue.resources.includes(req),
    );

    if (!hadAllResources) {
      return false;
    }
  }

  const newStart = time;
  const newEnd = time + course.duration;

  const venueBusy = currentSchedule.some((t) => {
    const slotVenueId = getId(t.venue);
    const venueId = getId(venue);

    if (!slotVenueId || !venueId || t.day !== day) return false;

    // Only block if it is the SAME venue
    if (slotVenueId !== venueId) return false;

    return t.startTime < newEnd && t.endTime > newStart;
  });

  if (venueBusy) {
    return false;
  }

  if (!course.lecturer || !course.lecturer._id) {
    return false;
  }

  const lecturerBusy = currentSchedule.some((t) => {
    const slotLecturerId = getId(t.lecturerId || t.lecturer);
    const lecturerId = getId(course.lecturer);

    if (!slotLecturerId || !lecturerId || t.day !== day) return false;
    if (slotLecturerId !== lecturerId) return false; // Only check this lecturer

    return t.startTime < newEnd && t.endTime > newStart;
  });

  if (lecturerBusy) {
    return false;
  }

  const lecturerNeedsBreak = currentSchedule.some((t) => {
    const slotLecturerId = getId(t.lecturerId || t.lecturer);
    const lecturerId = getId(course.lecturer);

    if (!slotLecturerId || !lecturerId || t.day !== day) return false;
    if (slotLecturerId !== lecturerId) return false;

    // Check if the new class starts exactly when an existing one ends (or vice versa)
    const endsWhenNewStarts = t.endTime === newStart;
    const startsWhenNewEnds = t.startTime === newEnd;

    return endsWhenNewStarts || startsWhenNewEnds;
  });

  if (lecturerNeedsBreak) return false;

  return true;
};

const getVenueLoad = (venueId, day, schedule) => {
  return schedule.filter(
    (t) => getId(t.venue) === getId(venueId) && t.day === day,
  ).length;
};

const calculateScore = (course, venue, day, time, schedule) => {
  let score = 0;
  const normalizeTime = (t) => parseInt(t.split(":")[0], 10);
  const lecturer = course.lecturer;

  // 1. Lecturer Preferences (Time)
  if (
    lecturer.preferences?.preferredTimes?.some((t) => normalizeTime(t) === time)
  ) {
    score += WEIGHTS.LECTURER_PREF_TIME;
  }

  // 2. Lecturer Preferences (Day)
  if (
    lecturer.preferences?.preferredDays?.length &&
    lecturer.preferences.preferredDays.includes(day)
  ) {
    score += WEIGHTS.LECTURER_PREF_DAY;
  }

  // 3. Venue Utilization
  if (venue.capacity > 0) {
    const utilization = course.expectedStudents / venue.capacity;
    score += utilization * WEIGHTS.VENUE_UTILIZATION;
  }

  // 4. Resource Waste (Penalty)
  if (
    venue.resources.length > 0 &&
    (!course.requiredResources || course.requiredResources.length === 0)
  ) {
    score += WEIGHTS.RESOURCE_WASTE;
  }

  // 5. Crowding Penalty (FIXED)
  // We use subtraction (-) to prefer quieter time slots
  const parallelVenueLoad = schedule.filter(
    (t) => t.day === day && t.startTime === time,
  ).length;

  score += parallelVenueLoad * WEIGHTS.CROWDING_PENALTY;

  // 6. Venue Load Balance
  // Penalize a venue if it is already heavily booked on this day
  const venueLoad = getVenueLoad(venue._id, day, schedule);
  score += venueLoad * WEIGHTS.SAME_DAY_LOAD;

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
      (a, b) => (b.expectedStudents || 0) - (a.expectedStudents || 0),
    );

    for (const course of courses) {
      let bestSlot = null;
      let maxScore = -Infinity;

      for (const day of DAYS) {
        for (const time of TIME_SLOTS) {
          for (const venue of venues) {
            if (isFeasible(course, venue, day, time, schedule)) {
              const score = calculateScore(course, venue, day, time, schedule);

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
            const score = calculateScore(
              course,
              venue,
              day,
              time,
              existingSchedule,
            );

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
