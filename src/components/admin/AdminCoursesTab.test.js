import { describe, it, expect } from 'vitest';
import { computeFunnelStages } from './AdminCoursesTab';

const COURSE = {
  id: "html",
  label: "HTML",
  totalLessons: 4,
  completedUsers: 1,
  modules: [
    {
      id: "m1",
      title: "Module 1",
      lessons: [
        { id: "l1", title: "Lesson 1" },
        { id: "l2", title: "Lesson 2" },
        { id: "l3", title: "Lesson 3" },
        { id: "l4", title: "Lesson 4" },
      ],
    },
  ],
};

function makeProgress(userId, lessonIds) {
  return lessonIds.map((lid) => ({
    user_id: userId,
    lesson_key: "c:html|m:m1|l:" + lid,
  }));
}

describe("computeFunnelStages()", () => {
  it("returns 5 stages: Started, 25%+, 50%+, 75%+, Completed", () => {
    const stages = computeFunnelStages(COURSE, makeProgress("u1", ["l1"]));
    expect(stages.map((s) => s.label)).toEqual(["Started", "25%+", "50%+", "75%+", "Completed"]);
  });

  it("returns all zeros when progress is empty", () => {
    const stages = computeFunnelStages(COURSE, []);
    stages.forEach((stage) => {
      expect(stage.count).toBe(0);
      expect(stage.pct).toBe(0);
    });
  });

  it("counts unique users in Started stage", () => {
    const progress = [
      ...makeProgress("u1", ["l1"]),
      ...makeProgress("u2", ["l1", "l2"]),
    ];
    const stages = computeFunnelStages(COURSE, progress);
    expect(stages[0]).toMatchObject({ label: "Started", count: 2, pct: 100 });
  });

  it("deduplicates lesson keys per user", () => {
    // u1 completes l1 twice — should count as 1 unique lesson
    const progress = [
      { user_id: "u1", lesson_key: "c:html|m:m1|l:l1" },
      { user_id: "u1", lesson_key: "c:html|m:m1|l:l1" },
    ];
    const stages = computeFunnelStages(COURSE, progress);
    // u1 has 1 unique lesson — 1/4 = 25%, meets the 25%+ threshold (ceil(4*0.25)=1)
    expect(stages.find((s) => s.label === "25%+").count).toBe(1);
    // 2/4 = 50%, not met
    expect(stages.find((s) => s.label === "50%+").count).toBe(0);
  });

  it("places a user reaching 50% (2/4 lessons) in Started and 25%+ but not 50%+", () => {
    const progress = makeProgress("u1", ["l1", "l2"]);
    const stages = computeFunnelStages(COURSE, progress);
    expect(stages.find((s) => s.label === "Started").count).toBe(1);
    expect(stages.find((s) => s.label === "25%+").count).toBe(1);
    expect(stages.find((s) => s.label === "50%+").count).toBe(1);
    expect(stages.find((s) => s.label === "75%+").count).toBe(0);
  });

  it("places a user completing all 4 lessons in every threshold stage", () => {
    const progress = makeProgress("u1", ["l1", "l2", "l3", "l4"]);
    const stages = computeFunnelStages(COURSE, progress);
    expect(stages.find((s) => s.label === "25%+").count).toBe(1);
    expect(stages.find((s) => s.label === "50%+").count).toBe(1);
    expect(stages.find((s) => s.label === "75%+").count).toBe(1);
  });

  it("uses course.completedUsers for the Completed stage count", () => {
    const progress = makeProgress("u1", ["l1"]);
    const stages = computeFunnelStages(COURSE, progress);
    expect(stages.find((s) => s.label === "Completed")).toMatchObject({
      label: "Completed",
      count: 1,
    });
  });

  it("ignores progress rows that do not belong to the course", () => {
    const foreignProgress = [{ user_id: "u1", lesson_key: "c:css|m:m1|l:l1" }];
    const stages = computeFunnelStages(COURSE, foreignProgress);
    stages.forEach((stage) => expect(stage.count).toBe(0));
  });

  it("calculates pct as count/uniqueUsers * 100 rounded", () => {
    const progress = [
      ...makeProgress("u1", ["l1", "l2"]),
      ...makeProgress("u2", ["l1"]),
      ...makeProgress("u3", ["l1"]),
    ];
    // 3 started; 1 reached 50%+ (u1 has 2/4 = 50%)
    const stages = computeFunnelStages(COURSE, progress);
    const fiftyStage = stages.find((s) => s.label === "50%+");
    expect(fiftyStage.pct).toBe(Math.round((1 / 3) * 100));
  });
});
