# Alarm Calculator

A fully local offline PWA for calculating when to set an alarm so you arrive at work on time.

## Phone install

Open the live app on your phone:

```text
https://wouterdep.github.io/alarm-calculator/
```

After the first load, add it to your home screen. The app then works offline. Settings stay on that phone.

### iPhone

1. Open the link in **Safari**.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Tap **Add**.

### Android

1. Open the link in **Chrome**.
2. Tap the **⋮** menu.
3. Tap **Install app** or **Add to Home screen**.

No database, account, server backend, or internet connection is required for the calculator itself after that first visit.

## Use It Locally

Open `index.html` directly in a browser for the simplest version.

For installable/offline PWA behavior, serve the folder locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Settings

The alarm is always for the next weekday morning. Friday night plans Monday.

- Regular / vacation week toggle
- Weekday arrival times (Mon–Fri) behind the settings button
- Baseline delay (getting up, toilet, teeth, clothes)
- Shower duration, or a wash duration when shower is off
- Shaving toggle and duration
- Breakfast toggle and duration
- Extra time buffer (off by default, 10 minutes when on)
- Transport mode: e-bike, racing bike, or car
- Travel duration for each transport mode

ETA fields and duration fields use five-minute increments.
