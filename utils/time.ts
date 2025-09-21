export const formatRelativeTimeFromSeconds = (
    unixSeconds: string | number,
    translate?: (key: string, vars?: Record<string, string | number>) => string
): string => {
    const now = Date.now();
    const ts = Number(unixSeconds) * 1000;
    if (!Number.isFinite(ts)) return "--";
    const duration = (ts - now) / 1000;

    const isPast = duration < 0;
    const absDuration = Math.abs(duration);

    if (absDuration < 60) {
        return translate
            ? translate("lessThanMinute")
            : "less than a minute ago";
    }

    let value: number;
    let unit: string;
    let translationKey: string;

    if (absDuration < 3600) {
        value = Math.round(absDuration / 60);
        unit = "minute";
        translationKey = value === 1 ? "minuteAgo" : "minutesAgo";
    } else if (absDuration < 86400) {
        value = Math.round(absDuration / 3600);
        unit = "hour";
        translationKey = value === 1 ? "hourAgo" : "hoursAgo";
    } else if (absDuration < 604800) {
        value = Math.round(absDuration / 86400);
        unit = "day";
        translationKey = value === 1 ? "dayAgo" : "daysAgo";
    } else if (absDuration < 2629746) {
        value = Math.round(absDuration / 604800);
        unit = "week";
        translationKey = value === 1 ? "weekAgo" : "weeksAgo";
    } else if (absDuration < 31556952) {
        value = Math.round(absDuration / 2629746);
        unit = "month";
        translationKey = value === 1 ? "monthAgo" : "monthsAgo";
    } else {
        value = Math.round(absDuration / 31556952);
        unit = "year";
        translationKey = value === 1 ? "yearAgo" : "yearsAgo";
    }

    if (isPast) {
        if (value === 1) {
            return translate ? translate(translationKey) : "a " + unit + " ago";
        } else {
            return translate
                ? translate(translationKey, { [unit + "s"]: value })
                : value + " " + unit + "s ago";
        }
    } else {
        const futureKey = translationKey.replace("Ago", "").replace("ago", "");
        const futureTranslationKey = `in${
            futureKey.charAt(0).toUpperCase() + futureKey.slice(1)
        }`;
        if (value === 1) {
            return translate
                ? translate(futureTranslationKey.replace(/\d+/, "1"))
                : "in a " + unit;
        } else {
            return translate
                ? translate(futureTranslationKey.replace(/\d+/, ""), {
                      [unit + "s"]: value,
                  })
                : "in " + value + " " + unit + "s";
        }
    }
};
