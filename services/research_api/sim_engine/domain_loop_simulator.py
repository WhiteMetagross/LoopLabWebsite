"""Event driven, action responsive simulators for corrective subprocesses."""
from __future__ import annotations

from bisect import bisect_right
from collections import Counter, defaultdict
from dataclasses import dataclass
import heapq
from itertools import count
from math import exp, isfinite
from typing import NamedTuple

import numpy as np


ACTIONS = ("standard", "specialist")
OUTCOMES = ("repeat", "resolved", "negative", "unobserved")
COMPLETE, SERVICE_READY, ROUTE = range(3)


class Timing(NamedTuple):
    service: float
    lag: float
    milestone: float | None
    before_service: float


class LoopLaw:
    def __init__(self, cases, minimum_cell, prior, by_attempt=True, repeat_requires_milestone=False):
        self.minimum_cell = minimum_cell
        self.pools = defaultdict(list)
        self.counts = Counter()
        for case in cases:
            for number, item in enumerate(case.attempts, 1):
                stage = self.stage(number)
                self.counts[stage, item.outcome] += 1
                before_service = item.before_service or 0.
                milestone = item.milestone
                if milestone is not None and item.before_service is None:
                    milestone = max(item.service, milestone)
                timing = Timing(item.service, max(0., item.elapsed - before_service - item.service), milestone, before_service)
                for key in ((stage, item.outcome), (0, item.outcome), (stage, "all"), (0, "all")):
                    self.pools[key].append(timing)

        pooled = np.array([self.counts[1, key] + self.counts[2, key] for key in OUTCOMES], float)
        if not pooled[1:].any():
            raise ValueError("Fit data need at least one observed exit")
        pooled /= pooled.sum()
        self.probabilities = {}
        self._cutoffs, self._exit_weights = {}, {}
        for stage in (1, 2):
            observed = np.array([self.counts[stage, key] for key in OUTCOMES])
            total = observed.sum() + prior
            values = (observed + prior * pooled) / total if by_attempt and total else pooled.copy()
            self.probabilities[stage] = values
            self._cutoffs[stage] = self._outcome_cutoffs(values)
            exits = tuple(map(float, values[1:]))
            self._exit_weights[stage] = exits if any(exits) else tuple(map(float, pooled[1:]))
        self.mean_service = float(np.mean([row[0] for row in self.pools[0, "all"]]))
        if self.mean_service <= 0:
            raise ValueError("Fit data need positive mean service")
        self.time_scale = float(np.mean([work + lag + before for work, lag, _, before in self.pools[0, "all"]]))
        self.repeat_pools = None
        if repeat_requires_milestone:
            self.repeat_pools = {key: [row for row in pool if row.milestone is not None] for key, pool in self.pools.items()}
            if not self.repeat_pools[0, "all"]:
                raise ValueError("A required repeat milestone has no fit observations")
        self._sampling_pools = {(stage, outcome): self.timing_pool(stage, outcome)
                                for stage in (1, 2) for outcome in OUTCOMES}

    @staticmethod
    def stage(attempt):
        return min(attempt, 2)

    def probability(self, attempt, scenario_repeat=None, log_odds_shift=0.):
        stage = self.stage(attempt)
        if scenario_repeat is None and log_odds_shift == 0.:
            return self.probabilities[stage]
        return np.asarray(self._shifted_weights(stage, scenario_repeat, log_odds_shift))

    def _shifted_weights(self, stage, scenario_repeat, log_odds_shift):
        p = self._cutoffs[stage][0] if scenario_repeat is None else scenario_repeat
        odds_factor = exp(log_odds_shift)
        p = p * odds_factor / (1 - p + p * odds_factor)
        resolved, negative, unobserved = self._exit_weights[stage]
        total = resolved + negative + unobserved
        left = 1 - p
        return p, left * resolved / total, left * negative / total, left * unobserved / total

    @staticmethod
    def _outcome_cutoffs(weights):
        repeat, resolved, negative, _ = map(float, weights)
        return repeat, repeat + resolved, repeat + resolved + negative

    def sample(self, attempt, outcome_draw, time_draw, scenario_repeat=None, log_odds_shift=0.):
        stage = self.stage(attempt)
        cutoffs = self._cutoffs[stage]
        if scenario_repeat is not None or log_odds_shift != 0.:
            cutoffs = self._outcome_cutoffs(self._shifted_weights(stage, scenario_repeat, log_odds_shift))
        outcome = OUTCOMES[bisect_right(cutoffs, outcome_draw)]
        pool = self._sampling_pools[stage, outcome]
        return outcome, pool[int(time_draw * len(pool))]

    def timing_pool(self, stage, outcome):
        pools = self.repeat_pools if outcome == "repeat" and self.repeat_pools is not None else self.pools
        for key in ((stage, outcome), (0, outcome), (stage, "all"), (0, "all")):
            pool = pools.get(key, ())
            if len(pool) >= self.minimum_cell or key == (0, "all"):
                return pool
        raise RuntimeError("Missing calibration timing pool")

    def expected_elapsed(self, attempt, scenario_repeat):
        stage = self.stage(attempt)
        means = [np.mean([work + lag + before for work, lag, _, before in self.timing_pool(stage, key)]) for key in OUTCOMES]
        return float(np.dot(self.probability(attempt, scenario_repeat), means))

    def summary(self):
        return {"mean_standard_service_minutes": self.mean_service, "reward_time_scale_minutes": self.time_scale, "stages": {
            str(stage): {"counts": {key: self.counts[stage, key] for key in OUTCOMES},
                         "probabilities": dict(zip(OUTCOMES, self.probabilities[stage].tolist()))}
            for stage in (1, 2)}}


def calibrate(cases, spec, config, by_attempt=True):
    return LoopLaw(cases, config["minimum_timing_cell"], config["stage_prior_cases"], by_attempt,
                   spec.get("repeat_requires_milestone", False))


@dataclass(frozen=True)
class Observation:
    case: int
    attempt: int
    time: float
    case_age: float
    difficulty_signal: float
    repeat_probability: float
    standard_jobs: int
    specialist_jobs: int
    standard_wait_estimate: float
    specialist_wait_estimate: float


@dataclass(frozen=True)
class AttemptResult:
    case: int
    attempt: int
    action: str
    ready: float
    service_ready: float
    service_start: float
    service_end: float
    end: float
    outcome: str
    server: int
    milestone_time: float | None


class LoopEnvironment:
    """Routing decisions occur at attempt entry. Each pool serves its own FIFO queue."""

    def __init__(self, law, spec, config, effect=0., scenario=False, unlimited=False, route_when_ready=False):
        self.law = law
        self.spec = spec
        self.limit = config["maximum_attempts"]
        self.capacity = {action: spec[f"{action}_servers"] for action in ACTIONS}
        self.multiplier = config["specialist_service_multiplier"]
        self.weights = config["reward_weights"]
        self.scenario_repeat = spec.get("scenario_repeat_probability") if scenario else None
        self.difficulty_span = config["difficulty_log_odds_span"] if scenario else 0.
        self.effect = effect
        self.unlimited = unlimited
        self.route_when_ready = route_when_ready
        if min(self.capacity.values()) < 1 or self.limit < 1 or not isfinite(self.multiplier) or self.multiplier <= 0 or not 0 <= effect <= 1:
            raise ValueError("Invalid capacity, attempt cap, or specialist settings")
        if self.scenario_repeat is not None and not 0 <= self.scenario_repeat < 1:
            raise ValueError("Scenario repeat probability must be in [0, 1)")
        if not isfinite(self.difficulty_span) or not 0 <= self.difficulty_span <= 20:
            raise ValueError("Difficulty log odds span must be finite and in [0, 20]")
        self.repeat_forecast = {stage: float(law.probability(stage, self.scenario_repeat)[0]) for stage in (1, 2)}
        self.observation = None

    def reset(self, arrivals, seed):
        self.arrivals = tuple(float(value) for value in arrivals)
        if not self.arrivals or any(not isfinite(value) or value < 0 for value in self.arrivals):
            raise ValueError("Use a nonempty sequence of finite nonnegative arrivals")
        noise, context = np.random.SeedSequence(seed).spawn(2)
        self.draws = np.random.default_rng(noise).random((len(self.arrivals), self.limit, 3))
        self.difficulty = np.random.default_rng(context).random(len(self.arrivals)) if self.difficulty_span else np.full(len(self.arrivals), .5)
        self.calendar, self.records = [], []
        self.pending_route = None
        self.sequence = count()
        self.free = {action: [(0., server) for server in range(len(self.arrivals) if self.unlimited else capacity)]
                     for action, capacity in self.capacity.items()}
        self.active = {action: [] for action in ACTIONS}
        for case, time in enumerate(self.arrivals):
            self._push(time, ROUTE, (case, 1))
        self.observation, completed = self._advance()
        assert not completed
        return self.observation

    def _push(self, time, priority, payload):
        heapq.heappush(self.calendar, (time, priority, next(self.sequence), payload))

    def _queue_state(self, action, clock):
        active = self.active[action]
        while active and active[0] <= clock:
            heapq.heappop(active)
        capacity = len(self.free[action])
        jobs = len(active)
        service = self.law.mean_service * (self.multiplier if action == "specialist" else 1.)
        estimate = max(0, jobs - capacity + 1) * service / capacity
        return jobs, estimate

    def _advance(self):
        completed = []
        while self.calendar:
            clock, priority, _, payload = heapq.heappop(self.calendar)
            if priority == SERVICE_READY:
                self._start_service(*payload)
                continue
            if priority == ROUTE:
                case, attempt, *prepared = payload
                if self.route_when_ready and not prepared:
                    outcome, timing = self._sample(case, attempt)
                    prepared = [clock, outcome, timing]
                    if timing.before_service > 0:
                        self._push(clock + timing.before_service, ROUTE, (case, attempt, *prepared))
                        continue
                self.pending_route = prepared or None
                standard_jobs, standard_wait = self._queue_state("standard", clock)
                specialist_jobs, specialist_wait = self._queue_state("specialist", clock)
                probability = self.repeat_forecast[self.law.stage(attempt)] if attempt < self.limit else 0.
                return Observation(case, attempt, clock, clock - self.arrivals[case], float(self.difficulty[case]), probability,
                                   standard_jobs, specialist_jobs, standard_wait, specialist_wait), completed
            result = payload
            self.records.append(result)
            completed.append(result)
            if result.outcome == "repeat":
                self._push(clock, ROUTE, (result.case, result.attempt + 1))
        return None, completed

    def step(self, action):
        if self.observation is None:
            raise RuntimeError("Reset the environment before making a decision")
        if action not in ACTIONS:
            raise ValueError(f"Unknown action: {action}")
        state = self.observation
        ready, outcome, timing = self.pending_route or (state.time, *self._sample(state.case, state.attempt))
        effect_draw = self.draws[state.case, state.attempt - 1, 2]
        if action == "specialist" and outcome == "repeat" and effect_draw < self.effect:
            outcome = "resolved"
        if outcome == "repeat" and state.attempt == self.limit:
            outcome = "cap"
        scheduled = (state, action, outcome, timing, ready)
        if not self.route_when_ready and timing.before_service > 0:
            self._push(ready + timing.before_service, SERVICE_READY, scheduled)
        else:
            self._start_service(*scheduled)
        self.observation, completed = self._advance()
        reward = sum(self.reward(row) for row in completed)
        return self.observation, reward, self.observation is None, tuple(completed)

    def _sample(self, case, attempt):
        outcome_draw, duration_draw, _ = self.draws[case, attempt - 1]
        shift = self.difficulty_span * (self.difficulty[case] - .5)
        return self.law.sample(attempt, outcome_draw, duration_draw, self.scenario_repeat, shift)

    def _start_service(self, state, action, outcome, timing, ready):
        service, lag, milestone, before = timing
        eligible = ready + before
        multiplier = self.multiplier if action == "specialist" else 1.
        free, server = heapq.heappop(self.free[action])
        start = max(eligible, free)
        stop = start + service * multiplier
        heapq.heappush(self.free[action], (stop, server))
        heapq.heappush(self.active[action], stop)
        milestone_time = None
        if milestone is not None:
            if milestone <= before and "service_ready_event" in self.spec:
                milestone_time = ready + milestone
            elif milestone < before + service:
                milestone_time = start + (milestone - before) * multiplier
            else:
                milestone_time = stop + min(lag, milestone - before - service)
        result = AttemptResult(state.case, state.attempt, action, ready, eligible, start, stop,
                               stop + lag, outcome, server, milestone_time)
        self._push(result.end, COMPLETE, result)

    def reward(self, result):
        scale = self.law.mean_service
        work = (result.service_end - result.service_start) / scale
        return -(result.end - result.ready) / self.law.time_scale - (
            self.weights["repeat"] * (result.outcome == "repeat")
            + self.weights["negative_exit"] * (result.outcome in {"negative", "unobserved", "cap"})
            + self.weights["specialist_work"] * work * (result.action == "specialist")
        )

    def case_rows(self):
        if self.observation is not None or not getattr(self, "records", None):
            raise RuntimeError("Run a workload to completion first")
        grouped = defaultdict(list)
        for row in self.records:
            grouped[row.case].append(row)
        return [{"case": case, "attempts": len(rows), "outcome": rows[-1].outcome,
                 "elapsed": rows[-1].end - self.arrivals[case],
                 "work": sum(row.service_end - row.service_start for row in rows),
                 "pre_service_wait": sum(row.service_ready - row.ready for row in rows),
                 "queue_wait": sum(row.service_start - row.service_ready for row in rows),
                 "specialist_attempts": sum(row.action == "specialist" for row in rows)}
                for case, rows in sorted(grouped.items())]

    def event_log(self):
        self.case_rows()
        events = []
        for row in self.records:
            terminal = {"repeat": "Another attempt indicated", "resolved": self.spec["resolved_event"],
                        "negative": self.spec["negative_event"], "unobserved": "Exit unobserved",
                        "cap": "Simulator attempt limit"}[row.outcome]
            phases = [
                (self.spec["ordinary_event"], "complete", row.ready),
            ]
            if "service_ready_event" in self.spec:
                phases.append((self.spec["service_ready_event"], "complete", row.service_ready))
            phases.extend(((self.spec["service_event"], "start", row.service_start),
                           (self.spec["service_event"], "complete", row.service_end)))
            if row.milestone_time is not None:
                phases.append((self.spec["milestone_event"], "complete", row.milestone_time))
            phases.append((terminal, "complete", row.end))
            for activity, lifecycle, clock in phases:
                events.append({"case": row.case, "attempt": row.attempt, "activity": activity,
                               "lifecycle": lifecycle, "time_minutes": clock, "action": row.action})
        return sorted(events, key=lambda event: event["time_minutes"])


def run_policy(env, arrivals, seed, policy):
    state = env.reset(arrivals, seed)
    while state is not None:
        state, _, _, _ = env.step(policy(state))
    return env.case_rows()
