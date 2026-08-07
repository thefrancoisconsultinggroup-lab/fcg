const defaultSummitStartAt = "2026-10-02T09:00:00-04:00";
const defaultSummitTimezone = "America/Port_of_Spain";

export type SummitEventConfig = {
  accessEmailEnabled: boolean;
  startAt: string;
  timezone: string;
};

export function getSummitEventConfig(): SummitEventConfig {
  const startAt = process.env.SUMMIT_EVENT_START_AT || defaultSummitStartAt;
  const timezone = process.env.SUMMIT_EVENT_TIME_ZONE || defaultSummitTimezone;

  return {
    accessEmailEnabled: Boolean(process.env.SUMMIT_EVENT_START_AT && process.env.SUMMIT_EVENT_TIME_ZONE),
    startAt,
    timezone,
  };
}

export function formatSummitEventDateTime(startAt = getSummitEventConfig().startAt, timezone = getSummitEventConfig().timezone) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(startAt));
}

export function summitAccessEmailWindowIsOpen(
  now: Date,
  startAt = getSummitEventConfig().startAt,
  timezone = getSummitEventConfig().timezone,
) {
  const eventInstant = new Date(startAt);

  if (Number.isNaN(eventInstant.getTime())) {
    return false;
  }

  const eventDayKey = formatDateKeyInTimezone(eventInstant, timezone);
  const reminderDayKey = formatDateKeyInTimezone(
    new Date(eventInstant.getTime() - (24 * 60 * 60 * 1000)),
    timezone,
  );
  const nowDayKey = formatDateKeyInTimezone(now, timezone);

  return nowDayKey === reminderDayKey && now.getTime() < eventInstant.getTime() && reminderDayKey !== eventDayKey;
}

function formatDateKeyInTimezone(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
