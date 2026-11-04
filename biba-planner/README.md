# Cycle Planner

A planner for a six-day timetable cycle. It shows lessons by week, month, list or cycle, skips holidays, handles weekend make-up days and cover swaps, keeps a title, notes and a media link for every lesson, and has a task list.

It is a plain static website with no build step and no server code. Your plans are saved in the browser straight away and synced to a JSON file in a **private** GitHub repository, so the same plans appear on every device.

## How it fits together

| Repository | Visibility | Holds |
|---|---|---|
| `cycle-planner` | Public (needed for free GitHub Pages) | This app. No personal data. |
| `cycle-planner-data` | **Private** | `planner.json`: your timetable, holidays and lesson plans. |

The app reads and writes `planner.json` through the GitHub API using a token that only you hold. The token is kept in each browser you connect, and is only ever sent to `api.github.com`.

## Setup (about 10 minutes)

### 1. Put the app on GitHub Pages

1. On GitHub, create a new **public** repository called `cycle-planner`.
2. Click **Add file → Upload files** and drag in everything from this folder (`index.html`, `fonts/`, `vendor/`, `.nojekyll`, this README). Commit.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the planner is live at `https://YOUR-USERNAME.github.io/cycle-planner/`.

### 2. Make the private data repository

1. Create a new **private** repository called `cycle-planner-data`.
2. Upload the `planner.json` file that came with this folder. It already contains your timetable and the Head's two cover swaps (Media A on Day 2, Media B on Day 3).

### 3. Create an access token

1. On GitHub go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name it `Cycle Planner`. Pick an expiry date and note it down; when it runs out, make a new token and paste it in again.
3. Under **Repository access** choose **Only select repositories** and pick `cycle-planner-data`.
4. Under **Permissions → Repository permissions**, set **Contents** to **Read and write**. Leave everything else as it is.
5. Generate the token and copy it (it starts with `github_pat_`).

### 4. Connect

1. Open the planner, click the **cog** in the top right, and find **Sync with GitHub**.
2. Enter your username, `cycle-planner-data`, and the token, then press **Connect**.
3. Tap which cycle day today is in the blue band at the top.

Repeat step 4 on each phone or computer you use. The same token works on all of them.

## Hosting on the school's servers instead

Copy this whole folder to any web server that serves static files (IIS, Apache, nginx, a shared drive with web access). Nothing needs installing. Sync still goes to your private GitHub repository, so the school server never holds your plans or your token.

## Day-to-day

- **Which day is it?** The planner counts school days from the date you set, skipping weekends and holidays. If the school resets or skips a day, tap a date's *Day* label in Week view and set it.
- **Settings:** the cog in the top right opens Settings (cycle day, holidays, timetable, GitHub sync).
- **Tasks:** the Tasks tab lists to-dos grouped into Overdue, Today, This week, Later and No due date. Give a task a class and press **Next lesson** to make it due at that class's next lesson. Tasks due in a lesson also appear when you open that lesson, and the lesson shows "1 task" in the Week view.
- **Holidays:** Settings → *Holidays & make-up days*. Add them one by one, upload the school calendar (PDF, text, CSV or .ics), or paste lines like `2027-02-05 to 2027-02-21 Spring Festival`. Put "make-up" in a line for a weekend school day.
- **Cover swaps:** in the Cycle view, any slot with two classes asks who teaches each. "Only lessons I teach" hides the ones someone else covers.
- **Lost lessons:** if a new holiday cancels a lesson that already had a plan, a banner offers to move the plan to the next lesson and shift later plans back.
- **New timetable:** Settings → *Timetable* → upload the PDF. Plans stay attached to the same class and period.

## When GitHub is slow or blocked

GitHub can be unreliable from mainland China. The planner saves every change in the browser first, so it keeps working without a connection. The status at the top right shows whether everything is synced. Unsynced changes are sent the next time GitHub can be reached, when you come back to the page or press **Sync now**.

If two devices save at the same moment, the planner merges them, keeping the newest version of each lesson.

## Files

- `index.html`: the whole app.
- `fonts/`: Big Shoulders Display, Schibsted Grotesk and JetBrains Mono (SIL Open Font License), hosted locally so they load where Google Fonts is blocked.
- `vendor/`: PDF.js 3.11.174 (Apache 2.0) for reading timetable and calendar PDFs.
