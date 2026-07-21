# 3D Models Directory

Place your zombie 3D model here:

```
public/models/zombie.glb
```

## Requirements

The game expects a GLB (glTF Binary) file with these animation clips:

| Clip Name       | Purpose                        | Required |
|-----------------|--------------------------------|----------|
| `Arise`         | Zombie rises from the ground   | Yes      |
| `Walking`       | Slow walk toward player        | Yes      |
| `Running`       | Fast run (close range)         | Yes      |
| `Attack`        | Melee attack swing             | Yes      |
| `Dead`          | Death animation                | Optional |
| `Alert`         | Alert/spotted player           | Optional |
| `Unsteady_Walk` | Idle swaying (demo mode)       | Optional |

## Scale

The model should be authored at **~1.6–1.8 meters tall** in real-world scale.
If exported from Blender with cm units, the Armature will have a 0.01 scale
(Blender's cm→m conversion) — this is handled automatically.

## How to get the file here

```bash
cp ~/zombie.glb public/models/zombie.glb
```

Or on Windows:
```cmd
copy C:\Users\You\zombie.glb public\models\zombie.glb
```
