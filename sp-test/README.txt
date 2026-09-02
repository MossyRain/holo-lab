HOLO LAB — ? ORB TEST 09

Changes from TEST 08:
- Restored and fixed the evaluation UI.
- Always shows LEFT and RIGHT stereo panels.
- TILT ON button is always visible in the header.
- Added RESET button.
- RESET uses the current device attitude as the new neutral/zero pose.
- Added explicit TEST 09 version display.
- Kept the low-latency rendering approach from TEST 08:
  no tilt easing,
  cached inclusion glow sprites,
  DPR cap 1.5,
  direct sensor response.
- Fixed 2D shell remains independent from device tilt.
