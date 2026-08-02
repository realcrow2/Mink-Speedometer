# mink_carhud

Vehicle HUD inspired by the circular gauge style (speed / RPM / fuel), dashboard icons, seatbelt, cruise control, and settings UI.

## Install

1. Copy `mink_carhud` into your server `resources` folder
2. Add to `server.cfg`:

```
ensure mink_carhud
```

3. Do **not** run `cd_carhud` at the same time (same keybinds / overlapping HUD)

## Controls (defaults)

| Action | Command / Key |
|--------|----------------|
| Settings | `/carhud` or **Y** |
| Seatbelt | `/seatbelt` or **B** |
| Cruise | `/cruise` or **=** |
| Toggle HUD | `/carhudtoggle` |
| Left indicator | **←** |
| Right indicator | **→** |
| Hazards | **↑** |

Configure framework, fuel script, and keys in `configs/config.lua`.
