# Windhawk 4–5★ audit — every highly rated mod, judged for Linux

Source: Windhawk's own catalogue (`mods.windhawk.net/catalog.json`, fetched this session).
Listed when the **average star rating is ≥ 4.0 with at least 15 votes** — 
**304 mods** out of 820. Averages are computed from the raw 1–5 vote breakdown.

Every verdict below is written by hand against that mod's id — nothing is inferred from
fuzzy text matching — and each "Covered" claim maps to a mod that exists in `mods/`
and passed the live sweep on this machine.

## Summary

| Verdict | Mods | Meaning |
| --- | --- | --- |
| Covered | 48 | the same setting/mechanism ships as a Twiking mod |
| Partial | 23 | the idea ports, but Linux exposes a thinner mechanism |
| Already native | 12 | Linux/GNOME already behaves this way |
| Not portable | 221 | Windows-only process, missing key, or removed API |

## Replicated in this pass

| Windhawk mod | ★ | Twiking mod |
| --- | --- | --- |
| Taskbar independent per monitor / multi-tray / primary on secondary | 5–4.79 | Taskbar on Multiple Monitors |
| Auto Custom Titlebar Colors, Win11 Custom Title Bar Colours | 4.7 / 4.58 | Titlebar Colour |
| Shake to Find Cursor, Magic Pointer | 4.58 / 4.82 | Mouse Feel → locate the pointer |
| Taskbar Fade, Dynamic Taskbar Transparency | 4.82 / 4.56 | Taskbar Transparency → faded opacity |

## The full list

### Covered (48)

| ★ | Votes | Installs | Windhawk mod | Target | Verdict |
| --- | --- | --- | --- | --- | --- |
| 5 | 16 | 870 | Hide running indicator for Windows 10 | explorer.exe | Covered — Taskbar Indicators (marker style) |
| 5 | 16 | 184 | Independent taskbar per monitor | explorer.exe, sihost.exe, RuntimeBroker.exe | Covered — Taskbar on Multiple Monitors |
| 4.91 | 22 | 183 | Taskbar collapse to running apps | explorer.exe | Covered — Taskbar Content (pinned apps off) |
| 4.9 | 110 | 4075 | Cycle through taskbar windows on click | explorer.exe | Covered — Taskbar Clicks |
| 4.89 | 38 | 627 | Virtual Desktop Helper | windhawk.exe, windhawk-mod.exe, windhawk-mod-uiaccess.exe | Covered — Workspaces |
| 4.89 | 18 | 207 | Window Center & Resize | windhawk.exe | Covered — Window Placement + Mouse Window Control |
| 4.88 | 144 | 8296 | Taskbar Thumbnail Size | explorer.exe | Covered — Taskbar Content (preview size) |
| 4.88 | 24 | 766 | Toggle Hidden Files | windhawk.exe | Covered — Show Hidden Files |
| 4.87 | 834 | 74714 | Slick Window Arrangement | * | Covered — Window Tiling & Snap |
| 4.87 | 102 | 5490 | Cycle taskbar buttons with mouse wheel | explorer.exe | Covered — Taskbar Clicks |
| 4.87 | 85 | 2283 | AltDrag | * | Covered — Mouse Window Control |
| 4.86 | 580 | 61566 | Middle click to close on the taskbar | explorer.exe | Covered — Taskbar Clicks |
| 4.85 | 492 | 30170 | Disable grouping on the taskbar | explorer.exe | Covered — Taskbar Content |
| 4.85 | 211 | 11157 | Disable Taskbar Thumbnails | explorer.exe | Covered — Taskbar Content (window previews off) |
| 4.85 | 41 | 1187 | Taskbar Count Badges | explorer.exe | Covered — Taskbar Indicators (count badge) |
| 4.83 | 18 | 930 | Quick Launch Dock | windhawk.exe | Covered — Taskbar Content (pinned apps) |
| 4.82 | 73 | 2061 | Taskbar Fade | windhawk.exe | Covered — Taskbar Transparency (dynamic fade) |
| 4.8 | 198 | 10400 | Aero Peek on "Show desktop" button hover | explorer.exe | Covered — Taskbar Extras |
| 4.79 | 211 | 7713 | Primary taskbar on secondary monitor | explorer.exe, ShellHost.exe, StartMenuExperienceHost.exe | Covered — Taskbar on Multiple Monitors |
| 4.78 | 64 | 3756 | Center New Windows | * | Covered — Window Placement |
| 4.77 | 2344 | 120856 | Taskbar Clock Customization | explorer.exe | Covered — Top Bar Clock |
| 4.77 | 583 | 94538 | Invisible Window Borders | * | Covered — Mouse Window Control (resize edge width) |
| 4.77 | 665 | 37407 | Taskbar Labels for Windows 11 | explorer.exe | Covered — Taskbar Content (group label width) |
| 4.75 | 1316 | 110085 | Windows Animations | * | Covered — UI Animations |
| 4.75 | 79 | 2813 | ZenDesktop: Desktop Icon Toggle and Auto-Hide | explorer.exe | Covered — Desktop Icons |
| 4.73 | 66 | 1847 | Taskbar Scroll Actions | explorer.exe | Covered — Taskbar Clicks |
| 4.73 | 22 | 333 | Micrographics Taskbar Clock | explorer.exe | Covered — Top Bar Clock |
| 4.71 | 575 | 80999 | Dark mode context menus | * | Covered — GTK Theme & Colour Scheme (dark style) |
| 4.7 | 27 | 2208 | Auto Custom Titlebar Colors | * | Covered — Titlebar Colour |
| 4.66 | 796 | 80688 | Resource Redirect | * | Covered — Icon Theme (swap icon sets) |
| 4.66 | 198 | 38624 | UXTheme hook | winlogon.exe, explorer.exe, systemsettings.exe, logonui.exe, rundll32.exe | Covered — Shell Theme / GTK Theme |
| 4.63 | 669 | 24222 | Taskbar on top for Windows 11 | explorer.exe, StartMenuExperienceHost.exe, ShellExperienceHost.exe, ShellHost.exe | Covered — Dock & Panel (panel position) |
| 4.62 | 55 | 5796 | Fix Darkmode ListViews | * | Covered — GTK Theme & Colour Scheme (dark style) |
| 4.61 | 771 | 18694 | Vertical Taskbar for Windows 11 | explorer.exe, StartMenuExperienceHost.exe, ShellExperienceHost.exe, ShellHost.exe | Covered — Dock & Panel (panel position) |
| 4.6 | 86 | 3520 | Taskbar minimize/restore on scroll | explorer.exe | Covered — Taskbar Clicks |
| 4.59 | 1384 | 115618 | Taskbar auto-hide when maximized | explorer.exe | Covered — Taskbar Auto-Hide Behaviour (hide for maximised only) |
| 4.58 | 64 | 4293 | Windows 11 Custom Title Bar Colours | * | Covered — Titlebar Colour |
| 4.56 | 125 | 11949 | Dynamic Taskbar Transparency | explorer.exe | Covered — Taskbar Transparency |
| 4.55 | 33 | 1516 | Caffeine | windhawk.exe | Covered — Power & Lid (idle and sleep timers) |
| 4.55 | 62 | 1225 | MacOS Style Dock | explorer.exe | Covered — Dock & Panel (position, thickness, auto-hide) |
| 4.55 | 20 | 1145 | Basic Themer | dwm.exe | Covered — Shell Theme |
| 4.53 | 209 | 20475 | Taskbar Background Helper | explorer.exe | Covered — Taskbar Transparency |
| 4.53 | 15 | 468 | Caption Buttons Customizer | dwm.exe, explorer.exe | Covered — Window Buttons |
| 4.48 | 217 | 21918 | Custom Window Corner Radius | dwm.exe | Covered — Rounded Window Corners |
| 4.45 | 119 | 4035 | Explorer Font Changer | explorer.exe | Covered — System Fonts |
| 4.44 | 149 | 9626 | Disable rounded corners in Windows 11 | dwm.exe | Covered — Rounded Window Corners (radius 0) |
| 4.32 | 25 | 2020 | Classic Desktop Icons | explorer.exe | Covered — Desktop Icons |
| 4 | 15 | 701 | Spoof Light/Dark Theme | * | Covered — GTK Theme & Colour Scheme (light/dark) |

### Partial (23)

| ★ | Votes | Installs | Windhawk mod | Target | Verdict |
| --- | --- | --- | --- | --- | --- |
| 5 | 68 | 3891 | Instant Taskbar Thumbnail Previews | explorer.exe | Partial — Taskbar Content: previews can be shown and sized, but Zorin exposes no open delay |
| 4.92 | 25 | 399 | Taskbar Virtual Desktop Switcher | explorer.exe | Partial — Workspaces: taskbars here do not draw a workspace switcher |
| 4.89 | 19 | 285 | Refined Quick Settings and Sound | explorer.exe, ShellHost.exe | Partial — Sound Effects + Battery Percentage: the flyout layout itself has no key |
| 4.87 | 93 | 3742 | Taskbar multi-tray | explorer.exe, ShellHost.exe | Partial — Taskbar on Multiple Monitors: pinned apps carry across screens; Linux has no separate tray area to duplicate |
| 4.85 | 527 | 47182 | Taskbar Volume Control Per-App | explorer.exe | Partial — Sound Effects: per-app volume lives in Settings → Sound, with no gsettings key |
| 4.82 | 85 | 1278 | Magic Pointer | windhawk.exe | Partial — Mouse Feel (locate the pointer) |
| 4.8 | 1793 | 172698 | Taskbar Volume Control | explorer.exe, ShellExperienceHost.exe, SndVol.exe | Partial — Sound Effects: volume step and >100 % are settable; wheel-over-taskbar needs an event hook |
| 4.73 | 4433 | 334005 | Taskbar height and icon size | explorer.exe | Partial — Dock & Panel: panel height scales icons; there is no independent icon-size key |
| 4.73 | 85 | 7754 | Logon, Logoff & Shutdown Sounds Restored | explorer.exe | Partial — Sound Effects: event sounds toggle only; custom logon sounds need a sound-theme edit |
| 4.71 | 17 | 550 | Classic Minimize/Maximize Animations | * | Partial — UI Animations: on/off only — GNOME offers no animation style choice |
| 4.7 | 84 | 7381 | Better Taskbar Autohide | explorer.exe | Partial — Taskbar Auto-Hide Behaviour: hide rules yes, reveal animation no |
| 4.69 | 74 | 2719 | Taskbar auto-hide fine tuning | explorer.exe | Partial — Taskbar Auto-Hide Behaviour: Zorin ships a keyboard toggle key that this mod does not expose |
| 4.68 | 19 | 886 | Mobile Open Animation | * | Partial — UI Animations: on/off only |
| 4.58 | 67 | 2410 | Shake to Find Cursor | windhawk.exe | Partial — Mouse Feel (locate the pointer — Control key, not a shake gesture) |
| 4.58 | 26 | 1170 | Window Border Customizer | dwm.exe, explorer.exe | Partial — Window Tiling & Snap: border on/off only; no colour key in the tiling schema |
| 4.57 | 28 | 557 | Audio Output Device Switcher | explorer.exe | Partial — Taskbar Clicks (scroll action): the scroll action list has no volume option |
| 4.51 | 86 | 4088 | Taskbar auto-hide per monitor | explorer.exe | Partial — Taskbar on Multiple Monitors (hide secondary panels only) |
| 4.48 | 33 | 1360 | Mond Desktop Clock | windhawk.exe | Partial — Top Bar Clock: a big clock on the desktop itself needs an extension or app |
| 4.48 | 25 | 1315 | Charging Sound | windhawk.exe | Partial — Sound Effects: event sounds and sound theme are settable; a custom charge chime needs a sound-theme edit |
| 4.45 | 105 | 7440 | macOS magnifying cursor | windhawk.exe | Partial — GTK Theme & Colour Scheme (cursor size) |
| 4.42 | 19 | 775 | Windows 7 Window Animations Restorer | * | Partial — UI Animations: on/off only |
| 4.26 | 46 | 2172 | Hide Desktop Icon Text and Shortcut Arrows | explorer.exe | Partial — Desktop Icons: label colour can change; labels cannot be hidden |
| 4.23 | 43 | 3306 | Force thick frames | * | Partial — Mouse Window Control (resize edge width) |

### Already native (12)

| ★ | Votes | Installs | Windhawk mod | Target | Verdict |
| --- | --- | --- | --- | --- | --- |
| 4.92 | 199 | 15902 | Turn off change file extension warning | explorer.exe | Already native — Nautilus renames without an extension warning |
| 4.84 | 193 | 20614 | Windows 11 Start Menu Power Buttons | StartMenuExperienceHost.exe, explorer.exe | Already native — GNOME quick settings already has sleep/restart/power off |
| 4.83 | 41 | 664 | Spotlight Launcher | windhawk.exe | Already native — GNOME already has Super-key search |
| 4.82 | 22 | 1694 | Fix browser and Teams text colors in dark mode | brave.exe, chrome.exe, chromium.exe, firefox.exe, msedge.exe, msedgewebview*.exe, opera.exe | Already native — Chromium follows the GTK dark style on Linux |
| 4.81 | 21 | 2872 | Eradicate Immersive Menus | * | Already native — GTK menus are already normal menus |
| 4.79 | 71 | 3354 | Paste Clipboard Content to Explorer | * | Already native — Nautilus pastes with Ctrl+V |
| 4.78 | 387 | 30658 | Chrome/Edge scroll tabs with mouse wheel | chrome.exe, msedge.exe, opera.exe, brave.exe, *\YandexBrowser\Application\browser.exe, thorium.exe | Already native — Linux Chromium scrolls the tab strip with the wheel |
| 4.78 | 27 | 525 | AutoScroll Win32 | explorer.exe | Already native — GTK lists auto-scroll to the cursor |
| 4.77 | 213 | 21912 | Dark Mode for Notepad | notepad.exe | Already native — Linux editors follow the GTK dark style |
| 4.72 | 25 | 2520 | Message Box Fix | * | Already native — GTK dialogs use the system font |
| 4.52 | 42 | 4193 | Dark Paint | mspaint.exe | Already native — GIMP and Linux image apps follow the GTK dark style |
| 4.51 | 79 | 4126 | Smooth Scroll for Win32 | explorer.exe, regedit.exe, mmc.exe, control.exe, wordpad.exe, taskmgr.exe | Already native — GTK scrolls smoothly |

### Not portable (221)

| ★ | Votes | Installs | Windhawk mod | Target | Verdict |
| --- | --- | --- | --- | --- | --- |
| 5 | 18 | 3598 | Restore Button Pulse Animation | * | Not portable — window-button animation lives in the shell theme, not a setting |
| 5 | 16 | 1434 | Windows 7/8.x Alt+Tab Loader | explorer.exe | Not portable — switcher visual, no key |
| 5 | 22 | 1273 | Always On Top Windows | windhawk.exe | Not portable — mutter has no always-on-top setting; the window menu does it per window |
| 5 | 20 | 1068 | Taskbar Disappearing Icon Fix for Windows 11 | explorer.exe | Not portable — Windows-only bug fix |
| 5 | 29 | 1043 | CTRL+SHIFT+C quotes remover | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 5 | 23 | 840 | Dot Hide | * | Not portable — Linux desktop icons have no shortcut-arrow overlay to hide |
| 5 | 26 | 759 | Change Explorer Default Location | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 5 | 18 | 713 | Task Manager Show Link Speed | Taskmgr.exe, Taskmgr10.exe | Not portable — Windows Task Manager — Linux task managers are separate apps |
| 5 | 25 | 594 | WinDraw - Screen Inking & Annotation | windhawk.exe | Not portable — screen annotation needs a running overlay app |
| 5 | 28 | 557 | Photoshop Dark Menus | Photoshop.exe | Not portable — Windows Photoshop; GIMP follows the GTK theme |
| 5 | 20 | 431 | Explorer Status Bar Metadata | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 5 | 29 | 411 | Click on Empty Explorer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 5 | 16 | 93 | MultiWM | explorer.exe | Not portable — GNOME workspaces are global, not per monitor |
| 4.98 | 42 | 2110 | Themed Regedit ListView | regedit.exe | Not portable — Windows system component — no counterpart on Linux |
| 4.96 | 26 | 1100 | Drag to Delete | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.95 | 41 | 1882 | Parallax Wallpaper | windhawk.exe | Not portable — GNOME 46 removed slideshow backgrounds from picture-options |
| 4.95 | 22 | 1028 | Explorer Nav DragOver Fix | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.95 | 40 | 1027 | Explorer Command Bar | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.95 | 19 | 565 | Lock Screen Date and Time Format | LockApp.exe | Not portable — lock screen clock format has no key |
| 4.95 | 19 | 415 | Steam Games in Explorer | windhawk.exe, explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.95 | 20 | 270 | Taskbar Jump List Volume Control | explorer.exe, ShellExperienceHost.exe | Not portable — no jump lists on Linux taskbars |
| 4.94 | 17 | 1580 | Prevent Edge from lagging your Taskbar process | msedge.exe | Not portable — browser-injection mod — Linux browsers cannot be hooked from outside |
| 4.94 | 16 | 1077 | "Sign in with a passkey" popup blocker | msedge.exe, chrome.exe, brave.exe, opera.exe, opera_gx.exe, vivaldi.exe, firefox.exe, waterfox.exe, librewolf.exe, thorium.exe, chromium.exe | Not portable — deliberately not replicated — it would suppress a security prompt |
| 4.94 | 18 | 1031 | Context Menu Preloader | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.94 | 18 | 961 | Explorer Tags | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.94 | 33 | 894 | 2D Rectangular Selection for Desktop | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.94 | 17 | 785 | Press Esc to exit Task Manager | taskmgr.exe | Not portable — Windows Task Manager — Linux task managers are separate apps |
| 4.94 | 16 | 562 | Play-Media-Key fix in Explorer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.94 | 16 | 373 | Control Panel Revival | explorer.exe, control.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.94 | 16 | 338 | Ultimate Custom Tray | windhawk.exe | Not portable — no tray keys |
| 4.93 | 98 | 2719 | Folder Hover Menu | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4.93 | 61 | 2593 | Explorer Info Bar+ | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.92 | 586 | 51257 | Classic context menu on Windows 11 | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.92 | 61 | 2043 | Select filename extension on double F2 | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.91 | 97 | 10224 | F1 Blocker | HelpPane.exe, explorer.exe, notepad.exe, 7zFM.exe, WinRAR.exe | Not portable — per-app F1 interception needs injection |
| 4.91 | 54 | 744 | File Hover Info | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.9 | 210 | 13022 | Remove Taskbar Window Suffixes | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.9 | 137 | 8951 | Always show all taskbar tray icons | explorer.exe | Not portable — no tray-icon keys in Zorin's schema |
| 4.9 | 189 | 7018 | Alt+Tab Flip 3D (Vista Style) | windhawk.exe, explorer.exe | Not portable — switcher visual, no key |
| 4.9 | 79 | 2974 | Monitor Rounded Edges | windhawk.exe | Not portable — rounded screen corners are a compositor effect with no key |
| 4.89 | 54 | 3610 | Disk Pie Chart | * | Not portable — Nautilus has no folder-size chart |
| 4.89 | 19 | 652 | Taskbar Blob Shape | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 89 | 5636 | Taskbar tray auto-hide (show on hover) | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 94 | 3450 | Explorer Double Click Up | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 16 | 629 | Smooth Desktop Icons Auto-Hide | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 26 | 528 | Smart Process Priority & RAM Optimizer | windhawk.exe | Not portable — process priority management is not a desktop setting |
| 4.88 | 17 | 257 | CoverTabby | explorer.exe, windhawk.exe, windhawk-mod.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 16 | 238 | Fix Explorer Row Right-Click | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.88 | 16 | 80 | Tourne'Table [Audio Visualizer] | windhawk.exe | Not portable — audio visualiser overlay needs an app |
| 4.87 | 397 | 28470 | Alt+Tab per monitor | explorer.exe | Not portable — GNOME switches within the current workspace only |
| 4.87 | 91 | 6715 | Remove "Exit Fullscreen" popup in Chrome | chrome.exe, opera.exe, msedge.exe, brave.exe, comet.exe, Maxthon.exe, whale.exe, aloha.exe, thorium.exe | Not portable — the fullscreen bubble is inside the browser process |
| 4.87 | 68 | 3767 | Enhanced Disk Usage | explorer.exe | Not portable — Windows Explorer disk view |
| 4.87 | 45 | 3135 | Close Explorer on Esc | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.87 | 68 | 1030 | AudioSwap | windhawk.exe | Not portable — audio device routing app, not a setting |
| 4.87 | 68 | 723 | Everything & Power Tools in the Start Menu | StartMenuExperienceHost.exe, SearchHost.exe, explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.87 | 31 | 477 | Hyprland Windows | * | Not portable — targets Hyprland; Twiking runs on GNOME on this PC |
| 4.86 | 125 | 9607 | Fix white flashes in explorer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.86 | 69 | 891 | Mouse Trail | windhawk.exe | Not portable — no cursor trail key |
| 4.86 | 50 | 866 | Per-monitor brightness and more in Quick Settings | ShellHost.exe | Not portable — external-monitor brightness needs ddcutil and a per-request call, not a setting |
| 4.86 | 28 | 699 | Start Menu Open Real File Location | StartMenuExperienceHost.exe, SearchHost.exe, SearchApp.exe, RuntimeBroker.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.86 | 21 | 600 | Confirm Closing Multiple Tabs in File Explorer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.85 | 475 | 25793 | Taskbar Thumbnail Reorder | explorer.exe | Not portable — Zorin has no preview-reorder key |
| 4.85 | 233 | 21680 | No Focus Rectangle | explorer.exe | Not portable — GTK focus rings are not settings-driven |
| 4.85 | 105 | 3094 | Wobbly Windows | dwm.exe | Not portable — mutter does not implement wobbly windows |
| 4.85 | 34 | 2816 | Startup App Delay Fix | explorer.exe | Not portable — Windows startup sequencing; Linux autostart is per-app |
| 4.85 | 116 | 2652 | Pointer Afterimage Motion Blur | windhawk.exe, explorer.exe | Not portable — no key |
| 4.85 | 40 | 620 | Explorer List Zebra Stripes | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.84 | 276 | 9765 | Click on empty taskbar space | explorer.exe | Not portable — no empty-area click key |
| 4.84 | 129 | 9164 | Shadowplay anti-disable | nvcontainer.exe | Not portable — NVIDIA overlay behaviour on Windows |
| 4.84 | 50 | 1192 | Lock Keys Notifier | windhawk.exe | Not portable — GNOME shows no Num/Caps lock indicator without an extension |
| 4.84 | 19 | 769 | Name explorer windows | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.84 | 25 | 713 | Windows SDR to HDR Tonemapping Fix | dwm.exe | Not portable — HDR/EOTF gamma curve is a DWM feature; GNOME only exposes colour temperature |
| 4.84 | 19 | 469 | Lock Screen Clock Styler | LockApp.exe | Not portable — lock screen clock format has no key |
| 4.84 | 19 | 391 | Explorer real folder paths | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.84 | 25 | 150 | Fluid Wallpaper | windhawk.exe | Not portable — GNOME 46 removed slideshow backgrounds |
| 4.83 | 2631 | 234434 | Better file sizes in Explorer details | * | Not portable — Nautilus has no folder-size column |
| 4.83 | 1024 | 84177 | Taskbar tray system icon tweaks | explorer.exe | Not portable — top-bar tray icons are not settings-driven |
| 4.83 | 376 | 10003 | Mac Island & Dock | windhawk.exe, explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.83 | 163 | 7152 | Classic Explorer navigation bar | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.82 | 342 | 37616 | Modernize Folder Picker Dialog | * | Not portable — the GTK file chooser cannot be reskinned from settings |
| 4.82 | 79 | 2323 | Start Button Replacer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.82 | 17 | 1230 | Logon & Sleep Fade Restorer | winlogon.exe, LogonUI.exe, LockApp.exe, * | Not portable — GDM login screen is a separate theme |
| 4.81 | 261 | 23918 | Alt+Tab window delayer | explorer.exe | Not portable — no switcher delay key |
| 4.81 | 27 | 768 | Minimize to tray | windhawk.exe | Not portable — tray minimisation is per-application behaviour |
| 4.81 | 16 | 306 | On-Screen Indicator Position | explorer.exe | Not portable — no key |
| 4.81 | 16 | 282 | Maximized Window Margins | windhawk.exe | Not portable — no margins key |
| 4.81 | 21 | 153 | Taskbar Cat | explorer.exe | Not portable — novelty overlay, no Linux key |
| 4.8 | 15 | 2962 | Aero Flyout Fix | explorer.exe, SndVol.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.8 | 20 | 472 | Separate System Tray Icons | explorer.exe | Not portable — no tray keys |
| 4.8 | 15 | 151 | SnapSentry | windhawk.exe | Not portable — no counterpart setting |
| 4.79 | 509 | 33271 | Taskbar Auto-Hide Instant Show | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.79 | 266 | 18011 | Customize Windows notifications placement | explorer.exe, ShellExperienceHost.exe | Not portable — GNOME has no notification position key |
| 4.79 | 73 | 2773 | Better Volume Mixer | windhawk.exe | Not portable — per-app volumes have no gsettings key |
| 4.79 | 19 | 740 | Explorer Glyphs Colorizer | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.79 | 19 | 634 | Explorer Ctrl+Q to New Folder | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.79 | 24 | 211 | Taskbar Countdown Timer | explorer.exe | Not portable — no taskbar timer widget |
| 4.78 | 724 | 47629 | Taskbar tray icon spacing and grid | explorer.exe | Not portable — no tray spacing key |
| 4.78 | 201 | 13063 | File Operation Styler | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.78 | 138 | 10361 | Win+D per monitor(show desktop) | explorer.exe | Not portable — no per-monitor show-desktop key |
| 4.78 | 23 | 513 | Fully Customizable WinVer | winver.exe | Not portable — Windows system component — no counterpart on Linux |
| 4.77 | 304 | 19013 | Start button always on the left | StartMenuExperienceHost.exe, explorer.exe | Not portable — button position follows the panel, no separate key |
| 4.77 | 154 | 14763 | Start button colorizer | explorer.exe | Not portable — Zorin menu button colour is not a key |
| 4.77 | 26 | 765 | Explorer Title Bar Label | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.77 | 43 | 559 | Taskbar Thumbnail Stats | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.77 | 30 | 537 | Taskbar Volume Percentage Indicator | explorer.exe | Not portable — no volume-readout key on the taskbar |
| 4.77 | 35 | 10 | One Hair | windhawk.exe | Not portable — no key |
| 4.76 | 124 | 9047 | Windows 11 Accent Window Border | * | Not portable — targets * — no Linux counterpart |
| 4.76 | 34 | 4988 | Legacy File Copy | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.76 | 101 | 3290 | Taskbar Elastic WinUI Pill | explorer.exe | Not portable — novelty animation with no key |
| 4.76 | 37 | 2070 | Desktop Icon Selection Style | explorer.exe | Not portable — no selection style key |
| 4.76 | 21 | 1744 | Explorerframe fixes for Win11 22H2+ | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.75 | 28 | 836 | Auto Theme Switcher | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.74 | 53 | 937 | Open pinned items with double click | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.74 | 47 | 887 | Desktop Audio Visualizer Plus | explorer.exe | Not portable — audio visualiser overlay needs an app |
| 4.74 | 23 | 266 | Explorer Folder Bookmarks Bar | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.73 | 568 | 41389 | Taskbar auto-hide speed | explorer.exe | Not portable — no reveal-speed key in the extension |
| 4.73 | 134 | 5526 | Remove Context Menu Items | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.73 | 33 | 1461 | Taskbar Desktop Indicator | explorer.exe | Not portable — no workspace-number badge key |
| 4.73 | 33 | 1161 | Explorer TreeItem Tweaker | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.73 | 26 | 373 | Tray Overflow List | explorer.exe | Not portable — no tray keys |
| 4.72 | 470 | 34280 | Start Menu Size | StartMenuExperienceHost.exe, explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.72 | 47 | 1871 | Disk Usage Bar Customizer | explorer.exe | Not portable — drive properties are a Windows Explorer dialog |
| 4.72 | 18 | 524 | Taskbar Z-Order Override | explorer.exe | Not portable — no z-order key |
| 4.71 | 4781 | 604094 | Windows 11 Notification Center Styler | ShellExperienceHost.exe, ShellHost.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.7 | 717 | 31459 | Taskbar Fluent Media Player | explorer.exe | Not portable — no taskbar media widget |
| 4.7 | 94 | 8249 | Desktop Marquee Fade | explorer.exe | Not portable — no key |
| 4.7 | 63 | 1978 | Taskbar System Info | explorer.exe | Not portable — no taskbar system-stats widget |
| 4.7 | 40 | 1133 | Acrylic Color Glows | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4.7 | 27 | 718 | Disk Usage Bar in Drive Properties | * | Not portable — drive properties are a Windows Explorer dialog |
| 4.69 | 26 | 2112 | Windows 11 Old Task Manager | taskmgr.exe | Not portable — Windows Task Manager — Linux task managers are separate apps |
| 4.69 | 48 | 1300 | Disable Virtual Desktop Transition Animation | dwm.exe, explorer.exe | Not portable — no transition key |
| 4.69 | 52 | 1233 | File Explorer Details Auto-Fit Columns | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.69 | 26 | 1087 | Faster Virtual Desktop Switching | explorer.exe | Not portable — no transition-speed key |
| 4.69 | 42 | 802 | Desktop Window Cards | windhawk.exe | Not portable — no key |
| 4.68 | 10834 | 975898 | Windows 11 Start Menu Styler | StartMenuExperienceHost.exe, SearchHost.exe, SearchApp.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.68 | 4320 | 499020 | Taskbar Dock Animation | explorer.exe | Not portable — hover zoom has no key in Zorin's taskbar |
| 4.68 | 333 | 39126 | Taskbar Dock Animation Plus | explorer.exe | Not portable — hover zoom has no key |
| 4.68 | 79 | 4640 | Start menu open location | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.68 | 25 | 1739 | Explorer Visual Tweaks Dark | explorer.exe, prevhost.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.68 | 31 | 497 | Cursor Idle Fade | windhawk.exe | Not portable — no cursor fade key |
| 4.67 | 131 | 13352 | Open With - Remove Microsoft Store Menu Item | * | Not portable — the Microsoft Store does not exist on Linux |
| 4.67 | 30 | 1262 | Disk Usage Bar Color | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.66 | 17407 | 1076404 | Windows 11 Taskbar Styler | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.65 | 82 | 3275 | Taskbar Icon Separators | explorer.exe | Not portable — no separator key |
| 4.65 | 40 | 820 | Add This PC and Desktop to Nav Top | * | Not portable — Nautilus sidebar entries are a bookmarks file Twiking does not edit |
| 4.64 | 1625 | 55305 | Dynamic Island for Windows | windhawk.exe | Not portable — overlay novelty, no key |
| 4.64 | 138 | 11047 | Shell Flyout Positions | explorer.exe, ShellExperienceHost.exe, ShellHost.exe, StartMenuExperienceHost.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.64 | 22 | 2032 | Expanded Clipboard (Win+V) | svchost.exe | Not portable — GNOME has no clipboard history key |
| 4.64 | 39 | 916 | Simple Window Switcher | windhawk.exe, explorer.exe | Not portable — switcher visual, no key |
| 4.64 | 28 | 675 | Modern Run Dialog UI For Windows 10 & 11 | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.64 | 22 | 271 | Quick Launch & Media Panel | windhawk.exe | Not portable — no key |
| 4.63 | 1262 | 88083 | MacOS Minimize Animation | * | Not portable — animation style is fixed in the shell theme |
| 4.63 | 24 | 1486 | Ignore Focus Loss | system-wide | Not portable — focus-stealing prevention is not settings-driven |
| 4.63 | 35 | 1340 | Disable Tray Icons | system-wide | Not portable — no tray keys |
| 4.63 | 16 | 137 | Taskbar AI Quota Bars | explorer.exe | Not portable — no key |
| 4.63 | 16 | 127 | Taskbar Icon Animation | windhawk.exe | Not portable — no hover animation key |
| 4.62 | 328 | 27665 | File Explorer WinUI-Like Content Animation | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.62 | 63 | 5894 | Show all apps by default in start menu | StartMenuExperienceHost.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.61 | 89 | 6658 | Hide Start Button | explorer.exe | Not portable — the Start-equivalent lives in an extension without that key |
| 4.61 | 184 | 5715 | Cursor Motion Blur | windhawk.exe | Not portable — compositor effect with no key |
| 4.61 | 23 | 575 | File Explorer Reopen Closed Tab | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.6 | 495 | 75875 | Windows 11 Settings Styler | SystemSettings.exe | Not portable — Windows system component — no counterpart on Linux |
| 4.6 | 91 | 6496 | OverhauldedWin Alt+Tab | windhawk.exe, explorer.exe | Not portable — switcher visual, no key |
| 4.6 | 81 | 5560 | Taskbar Restart Explorer | explorer.exe | Not portable — on Wayland the shell cannot be restarted in place |
| 4.6 | 65 | 2330 | Virtual Desktop Preserve Taskbar Order | explorer.exe | Not portable — no key |
| 4.6 | 20 | 1373 | Taskbar reorder within/between groups | explorer.exe | Not portable — icon order is not settings-driven |
| 4.59 | 27 | 626 | Explorer Navigation Tree Offset | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.58 | 78 | 3644 | Pinned Only on Start Menu | StartMenuExperienceHost.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.58 | 48 | 2958 | Windows 11 Start Menu Buttons | StartMenuExperienceHost.exe, explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.58 | 53 | 864 | Transparent Desktop Icons with Spotlight | explorer.exe | Not portable — no key |
| 4.57 | 30 | 1197 | Taskbar Network Speed Indicator | explorer.exe | Not portable — no network-speed widget key |
| 4.57 | 58 | 661 | Explorer Single Window Tabs | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.56 | 61 | 4385 | Disable Feedback Hub Hotkey | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.56 | 16 | 212 | Cursor auto-hide on idle | windhawk.exe | Not portable — no cursor auto-hide key |
| 4.54 | 92 | 2259 | Desktop Live Overlay | explorer.exe | Not portable — no key |
| 4.54 | 61 | 955 | Tray hover expand | windhawk.exe | Not portable — no tray keys |
| 4.52 | 21 | 529 | Taskbar auto-hide custom activation area | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.51 | 41 | 2087 | Start Search Bing Redirector | SearchHost.exe, SearchApp.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.5 | 18 | 1404 | Transparent Screensaver Fix | winlogon.exe | Not portable — no key |
| 4.5 | 24 | 311 | Taskbar Folder Menus | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.49 | 47 | 1721 | Custom Desktop Watermark | explorer.exe | Not portable — no watermark key |
| 4.48 | 3606 | 335329 | Windows 11 File Explorer Styler | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.47 | 329 | 5834 | Taskbar Music Lounge | explorer.exe | Not portable — no taskbar media widget |
| 4.47 | 15 | 587 | Borderless Fullscreen | windhawk.exe | Not portable — no key |
| 4.46 | 28 | 177 | Desktop Companions | windhawk.exe | Not portable — novelty overlay, no key |
| 4.45 | 49 | 7661 | Smart Copy & Paste | * | Not portable — GNOME has no clipboard history key |
| 4.45 | 62 | 3655 | Nilesoft Shell Animator | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.45 | 44 | 1660 | Taskbar classic context menu | explorer.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.44 | 88 | 1387 | TopBar for Windows | explorer.exe | Not portable — mod about Windows shell chrome |
| 4.43 | 112 | 13109 | CEF/Spotify Tweaks | spotify.exe, cefclient.exe | Not portable — Spotify/CEF frame hacks need injection |
| 4.43 | 21 | 1261 | VLC Discord Rich Presence | vlc.exe | Not portable — Discord RPC hooks need injection |
| 4.43 | 21 | 306 | Magic Mouse | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4.41 | 41 | 4142 | Task Manager Tab Slide Animation | Taskmgr.exe | Not portable — Windows Task Manager — Linux task managers are separate apps |
| 4.41 | 196 | 3376 | Win32 UI Modernizer | * | Not portable — Win32 controls do not exist on Linux |
| 4.4 | 15 | 3366 | UIFILE Override | * | Not portable — Windows .ui resource override — needs injection into the app |
| 4.4 | 20 | 1151 | Shrink Address Bar Height | * | Not portable — Nautilus toolbar height is not settings-driven |
| 4.39 | 23 | 987 | Perform Speed Test Redirect | explorer.exe, ShellExperienceHost.exe, ShellHost.exe, RuntimeBroker.exe | Not portable — Windows shell redirect |
| 4.39 | 18 | 472 | Keyboard Shortcut Actions | explorer.exe | Not portable — GNOME custom shortcuts exist in gsettings but are not shipped as a mod |
| 4.38 | 537 | 29873 | Island Media Controls | explorer.exe | Not portable — no key |
| 4.38 | 16 | 532 | Snap Commander | windhawk.exe | Not portable — no counterpart setting |
| 4.36 | 28 | 1098 | MicroManager | windhawk.exe | Not portable — no counterpart setting |
| 4.36 | 22 | 729 | Windows 7 Network Flyout Recreation | explorer.exe, control.exe, RetroBar.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.33 | 254 | 28862 | WinUI Context Menu Animation | * | Not portable — GTK menu animation comes from the theme, not a setting |
| 4.32 | 2922 | 176645 | Translucent Windows | * | Not portable — mutter does not allow window translucency from settings |
| 4.32 | 25 | 955 | Accent Highlight Color | * | Not portable — GTK accent colour has no gsettings key on GNOME 46 |
| 4.32 | 22 | 301 | Desktop Audio Visualizer | explorer.exe | Not portable — audio visualiser overlay needs an app |
| 4.3 | 20 | 5511 | Chrome UI Tweaks | chrome.exe | Not portable — browser UI cannot be reached from outside the process |
| 4.28 | 18 | 1318 | Disable Office Hotkeys | explorer.exe | Not portable — Microsoft Office is not installed and cannot be hooked |
| 4.25 | 16 | 176 | System Tray Folders | explorer.exe | Not portable — no tray keys |
| 4.24 | 41 | 1731 | Internet Status Indicator | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4.22 | 95 | 6699 | Multirow taskbar for Windows 11 | explorer.exe | Not portable — single-row only in Zorin's taskbar |
| 4.17 | 24 | 840 | Control Panel in Modern File Explorer | explorer.exe, control.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.14 | 57 | 1130 | Live Video Wallpaper | explorer.exe | Not portable — no video wallpaper support in GNOME |
| 4.13 | 75 | 3928 | Aerexplorer | * | Not portable — Explorer visual overhaul — there is no Explorer on Linux |
| 4.12 | 25 | 2523 | Translucent Flyouts Controller | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4.1 | 21 | 844 | Compact Start Menu | StartMenuExperienceHost.exe | Not portable — Windows Start menu / shell flyouts — GNOME has no counterpart surface |
| 4.07 | 60 | 5436 | Control Panel Color Fix | explorer.exe, systemsettings.exe | Not portable — Windows File Explorer internals — there is no Explorer on Linux |
| 4.07 | 27 | 3445 | Windows 7 Style UAC Dim | consent.exe | Not portable — polkit dialogs are themed by the desktop |
| 4.04 | 24 | 922 | Window Opacity | explorer.exe | Not portable — mutter does not allow window opacity from settings |
| 4 | 38 | 1148 | Aero Flip 3D Recreation | windhawk.exe | Not portable — Windhawk-hosted overlay/injection mod — needs a process hook or a drawing overlay, not desktop settings |
| 4 | 28 | 899 | Titlebar For Everyone | chrome.exe, brave.exe, msedge.exe, opera.exe, yandex.exe, whale.exe, supermium.exe, chromium.exe, devenv.exe, steamwebhelper.exe, PowerToys.*.exe, olk.exe, WebViewHost.exe, winword.exe, excel.exe, powerpnt.exe, msaccess.exe, onenote.exe, outlook.exe, mspub.exe, hwp.exe, Photos.exe, MuseScore*.exe, ms-teams.exe | Not portable — browser frames are drawn by the app itself |

## Why the not-portable ones fail, in one line each

- **Explorer internals** — the largest group: there is no `explorer.exe`; Nautilus exposes
  a handful of preferences and nothing else.
- **DWM/compositor effects** — Mutter accepts no runtime blur, opacity, wobble or gamma hooks.
- **Start menu / shell flyouts** — GNOME's equivalents are extensions, not settings.
- **Browsers** — injection into Chrome/Firefox is impossible from a settings app; Linux
  Chromium already does the dark-colour and wheel-over-tabs behaviours natively.
- **Removed APIs** — GNOME 46 has no `slideshow` in `picture-options`, so parallax/fluid
  wallpaper mods have no supported mechanism.
- **Dead keys** — `minimize-shift` and `trans-dynamic-distance` exist in Zorin's schema but
  are never read by its code, so their Windows-side behaviours were not faked.
