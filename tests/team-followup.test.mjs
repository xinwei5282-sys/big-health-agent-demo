import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

const source = readFileSync(new URL("../src/Prototype.tsx", import.meta.url), "utf8");
const data = await import("../src/business-demo-data.ts");
const helpers = source.slice(source.indexOf("function getTeamStats("), source.indexOf("async function requestAi("));
const { getTeamFollowup, getPriorityTeamFollowups } = vm.runInNewContext(`${stripTypeScriptTypes(helpers)};({getTeamFollowup,getPriorityTeamFollowups})`, { ...data });

test("team follow-up counts come from team task states", () => {
  const team = data.managedTeams.find((item) => item.id === "team-hz");
  const result = getTeamFollowup(team);
  assert.equal(result.pendingCount, 2);
  assert.equal(result.feedbackCount, 1);
  assert.equal(result.nextDeadline, "10/30");
  const completed = getTeamFollowup({ ...team, tasks: team.tasks.map((task) => ({ ...task, status: "已完成" })) });
  assert.equal(completed.pendingCount, 0);
  assert.equal(completed.feedbackCount, 0);
  assert.equal(completed.nextDeadline, "");
});
test("priority ordering uses upcoming tasks and does not mutate the team list", () => {
  const before = JSON.stringify(data.managedTeams);
  assert.equal(JSON.stringify(getPriorityTeamFollowups(data.managedTeams).map((item) => item.team.id)), JSON.stringify(["team-hz", "team-nb"]));
  assert.equal(JSON.stringify(data.managedTeams), before);
  assert.equal(getPriorityTeamFollowups([]).length, 0);
});
test("opening a team from workbench records workbench as the return origin", () => {
  const state = { screen: "workbench", marketMode: "partners", memberReturnScreen: "team-detail", keyboard: { hide() {} } };
  for (const [setter, key] of Object.entries({ setTeamReturnMode: "teamReturnMode", setTeamReturnScreen: "teamReturnScreen", setSelectedTeamId: "selectedTeamId", setTeamDetailTab: "teamDetailTab", setScreen: "screen" })) state[setter] = (value) => { state[key] = value; };
  const start = source.indexOf("  const openTeam =");
  const fn = source.slice(start, source.indexOf("\n", start));
  vm.runInNewContext(`${stripTypeScriptTypes(fn)};openTeam("team-hz")`, state);
  assert.equal(state.teamReturnScreen, "workbench");
  assert.equal(state.selectedTeamId, "team-hz");
  assert.equal(state.screen, "team-detail");
});
