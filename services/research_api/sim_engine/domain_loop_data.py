"""Acquire and extract observed corrective subprocess logs."""
from __future__ import annotations

import csv
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
import gzip
import hashlib
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.request import Request, urlopen


DOMAIN_ALIASES = {"simclaims": "insurance", "simfactory": "manufacturing"}
DOMAIN_CHOICES = (*DOMAIN_ALIASES, "bpisim", "insurance", "manufacturing", "both", "all")


def selected_domains(config, selection):
    selection = selection.lower()
    selection = DOMAIN_ALIASES.get(selection, selection)
    for index, (domain, spec) in enumerate(config["domains"].items()):
        if selection in (domain, "all") or (selection == "both" and domain in {"insurance", "manufacturing"}):
            yield index, domain, spec


@dataclass(frozen=True)
class Event:
    activity: str
    start: float
    end: float


@dataclass(frozen=True)
class Attempt:
    outcome: str
    elapsed: float
    service: float
    milestone: float | None = None
    before_service: float | None = None


@dataclass(frozen=True)
class Case:
    key: str
    entry: float
    source_end: float
    attempts: tuple[Attempt, ...]


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def acquire(spec, limit, download=False):
    path = Path(spec["source_path"])
    limit = spec.get("maximum_download_bytes", limit)
    if not path.exists() and download:
        request = Request(spec["source_url"], headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(request, timeout=30) as response:
            payload = response.read(limit + 1)
        if len(payload) > limit or sha256(payload) != spec["sha256"]:
            raise ValueError(f"Download exceeds the limit or fails checksum: {path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(dir=path.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
            try:
                temporary.write(payload)
                temporary.flush()
                temporary_path.replace(path)
            finally:
                temporary_path.unlink(missing_ok=True)
    if not path.exists():
        raise FileNotFoundError(f"{path}. Run the simulator with --download.")
    if path.stat().st_size > limit or sha256(path.read_bytes()) != spec["sha256"]:
        raise ValueError(f"Source exceeds the limit or fails checksum: {path}")
    return path


def minutes(text):
    stamp = datetime.fromisoformat(text)
    # The production derivative has naive timestamps. Use one clock without DST.
    return stamp.replace(tzinfo=stamp.tzinfo or timezone.utc).timestamp() / 60


def read_events(path, domain):
    traces = defaultdict(list)
    if domain == "insurance":
        opener, case, start, end, activity = open, "instance_id", "timestamp", "timestamp", "state_name"
    else:
        opener, case, start, end, activity = gzip.open, "case_id", "start_time", "end_time", "Activity"
    with opener(path, "rt", encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            begin, finish = minutes(row[start]), minutes(row[end])
            if finish < begin or not row[case] or not row[activity].strip():
                raise ValueError(f"Invalid event in {path}")
            traces[row[case]].append(Event(row[activity].strip(), begin, finish))
    return traces


def is_inspection(activity):
    name = activity.casefold()
    return "q.c" in name or "inspection" in name


def extract_case(key, source, domain, spec, audit):
    events = sorted(source, key=lambda event: event.start)
    source_end = max(event.end for event in events)
    if domain == "insurance":
        is_marker = lambda name: name == spec["ordinary_event"]
        exits = {spec["resolved_event"]: "resolved", spec["negative_event"]: "negative"}
    else:
        is_marker = lambda name: "rework" in name.casefold()
        exits = {spec["resolved_event"]: "resolved"}
    first = next((i for i, event in enumerate(events) if is_marker(event.activity)), None)
    if first is None:
        return None

    groups = [[events[first]]]
    terminal, end_time = "unobserved", source_end
    if domain == "manufacturing":
        final_repair_end = max(event.end for event in events if is_marker(event.activity))
        packing = next((event for event in events if event.activity in exits and event.start >= final_repair_end), None)
        if packing is not None:
            terminal, end_time = exits[packing.activity], packing.end
    inspection_end = None
    latest_repair_end = events[first].end
    for i in range(first + 1, len(events)):
        event = events[i]
        if domain == "insurance" and event.activity in exits:
            terminal, end_time = exits[event.activity], event.end
            audit["markers_after_exit"] += sum(is_marker(row.activity) for row in events[i + 1:])
            break
        if domain == "manufacturing" and is_inspection(event.activity) and event.start >= latest_repair_end:
            inspection_end = event.end if inspection_end is None else min(inspection_end, event.end)
        if not is_marker(event.activity):
            continue
        if domain == "insurance":
            new_attempt = not is_marker(events[i - 1].activity)
        else:
            new_attempt = inspection_end is not None and inspection_end <= event.start
        if new_attempt:
            groups.append([event])
        else:
            groups[-1].append(event)
            audit["markers_merged_into_episode"] += 1
        latest_repair_end = max(latest_repair_end, event.end)
        inspection_end = None

    attempts = []
    for index, group in enumerate(groups):
        last = index == len(groups) - 1
        stop = end_time if last else groups[index + 1][0].start
        elapsed = stop - group[0].start
        if domain == "insurance":
            service = min(spec["assumed_service_minutes"], elapsed)
            milestones = [event.end for event in events if event.activity == "Damage documents"
                          and group[-1].end < event.start < stop]
        else:
            service = sum(event.end - event.start for event in group)
            if service > elapsed + 1e-7:
                audit["parallel_repair_minutes_removed"] += service - elapsed
                service = elapsed
            latest_service = max(event.end for event in group)
            milestones = [event.end for event in events if is_inspection(event.activity)
                          and event.start >= latest_service and event.end <= stop]
        milestone = min(milestones) - group[0].start if milestones else None
        audit["attempts_with_observed_milestone"] += milestone is not None
        attempts.append(Attempt(terminal if last else "repeat", elapsed, service, milestone))
    return Case(key, events[first].start, source_end, tuple(attempts))


def load_cases(path, domain, spec):
    if domain == "bpisim":
        from src.bpisim_data import load_bpi_cases

        return load_bpi_cases(path, spec)
    traces = read_events(path, domain)
    audit = Counter()
    cases = [extract_case(key, events, domain, spec, audit) for key, events in traces.items()]
    cases = [case for case in cases if case is not None]
    audit.update(source_cases=len(traces), source_events=sum(map(len, traces.values())), eligible_cases=len(cases))
    return cases, dict(audit)


def chronological_split(cases, fraction):
    ordered = sorted(cases, key=lambda case: (case.entry, case.key))
    boundary = ordered[int(len(ordered) * fraction)].entry
    fit = [case for case in ordered if case.entry < boundary and case.source_end < boundary]
    holdout = [case for case in ordered if case.entry >= boundary]
    if not fit or not holdout:
        raise ValueError("Both chronological partitions need eligible cases")
    return fit, holdout, boundary, len(cases) - len(fit) - len(holdout)
