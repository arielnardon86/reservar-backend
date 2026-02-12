
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';
import { getDay, format } from 'date-fns';

const run = () => {
    // Current simulated date/time from user: 2026-02-12
    const baseYear = 2026;
    const baseMonth = 2; // February
    const baseDay = 13; // Friday

    const timeZone = 'America/Argentina/Buenos_Aires';

    console.log(`--- Debugging Timezone logic for ${baseYear}-${baseMonth}-${baseDay} in ${timeZone} ---`);

    // 1. Check getDayOfWeekInTZ logic
    const dateStr = `${baseYear}-${String(baseMonth).padStart(2, '0')}-${String(baseDay).padStart(2, '0')} 12:00`;
    console.log(`Original Date String: ${dateStr}`);

    const zonedDate = fromZonedTime(dateStr, timeZone);
    console.log(`Zoned Date (UTC): ${zonedDate.toISOString()}`);

    const localDate = toZonedTime(zonedDate, timeZone);
    console.log(`Local Date (Result of toZonedTime): ${localDate.toISOString()}`); // This shows the shifted time
    console.log(`Local Date (toString): ${localDate.toString()}`);

    const dayIndex = getDay(localDate);
    console.log(`Day Index (getDay): ${dayIndex} (Expected: 5 for Friday)`);

    // 2. Check slot generation logic logic
    // simulate localToUTC and utcToLocalString roundtrip
    const h = 11;
    const m = 0;
    const slotStr = `${baseYear}-${String(baseMonth).padStart(2, '0')}-${String(baseDay).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const slotStartUtc = fromZonedTime(slotStr, timeZone);
    console.log(`Slot ${h}:${m} -> UTC: ${slotStartUtc.toISOString()}`);

    // Emulating the FIX
    const backToLocal = toZonedTime(slotStartUtc, timeZone);

    // OLD flawed way (if server is UTC, this prints 14:00)
    // const formattedOld = format(backToLocal, 'HH:mm'); 

    // NEW correct way (explicitly passing timezone to format)
    // NOTE: date-fns-tz 'format' can take a Date and a timeZone option. 
    // Wait, `format` imported from date-fns-tz is legacy/different in v3?
    // In v3: import { format } from 'date-fns-tz'; format(date, fmt, { timeZone })

    // Let's test what we implemented:
    // we used: return format(toZonedTime(utcDate, timeZone), 'HH:mm');
    // AND we imported format from date-fns in the original file.
    // The previous code had: import { format, getDay } from 'date-fns';
    // So `format` is from `date-fns`, NOT `date-fns-tz`.

    // If `format` is from `date-fns`, and we pass it a Date object (which `toZonedTime` returns),
    // it will format it using the SYSTEM's local timezone.
    // `toZonedTime` in v3 returns a Date object that is "shifted" so that its UTC components match the target timezone's local components.
    // BUT the system timezone still applies when printing/formatting if not careful.

    // Actually, `toZonedTime` returns a Date where the UTC parts represent the local time.
    // e.g. 11:00 ART -> 14:00 UTC real.
    // toZonedTime(14:00 UTC, ART) -> Returns a Date that is 11:00 UTC.
    // If we format this as ISO/UTC, it prints 11:00 Z.
    // If we format this using local system time... validation depends on system time.

    // If I am on a UTC server:
    // Date(11:00 UTC). format() -> "11:00"

    // If I am on a -3 server:
    // Date(11:00 UTC) is 08:00 Local. format() -> "08:00" !!

    // So `format(toZonedTime(utcDate, tz), 'HH:mm')` ONLY works if the machine running it is in UTC?
    // Let's verify this hypothesis.

    console.log(`System Timezone Offset: ${new Date().getTimezoneOffset()}`);

    const formatted = format(backToLocal, 'HH:mm');
    console.log(`Back to Local formatted with date-fns format: ${formatted}`);

    if (formatted !== '11:00') {
        console.error("FATAL: Roundtrip failed!");
    } else {
        console.log("SUCCESS: Roundtrip matches.");
    }
}

run();
