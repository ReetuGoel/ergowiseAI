# safe_load_model.py
# Run this with your venv active to see detailed output about allowed globals
import os
os.environ['TORCH_WEIGHTS_ONLY'] = 'False'  # only for trusted checkpoints

import importlib
import traceback

def try_register(torch_mod, obj):
    # Ensure we register actual class objects (not strings). The torch
    # weights-only unpickler expects real class objects when checking
    # allowed globals; registering strings can lead to AttributeError.
    try:
        if isinstance(obj, str):
            parts = obj.split('.')
            mod_name = '.'.join(parts[:-1])
            cls_name = parts[-1]
            try:
                mod = importlib.import_module(mod_name)
                cls = getattr(mod, cls_name)
            except Exception as ie:
                print(f"Could not import {obj!r}: {ie}")
                return False
            target = cls
        else:
            target = obj

        try:
            torch_mod.serialization.add_safe_globals([target])
            print(f"add_safe_globals succeeded for {target}")
            return True
        except Exception as e:
            try:
                torch_mod.serialization.safe_globals([target])
                print(f"safe_globals succeeded for {target}")
                return True
            except Exception as ee:
                print(f"Failed to register {target}: {e}; fallback: {ee}")
                return False
    except Exception as final_e:
        print(f"Unexpected error in try_register for {obj!r}: {final_e}")
        return False

def main():
    import torch
    from ultralytics import YOLO
    print("torch version:", torch.__version__)
    candidates = [
        "ultralytics.nn.tasks.PoseModel",
        "ultralytics.nn.modules.conv.Conv",
        "torch.nn.modules.conv.Conv2d",
        "torch.nn.modules.container.Sequential",
        # add any additional strings reported by errors here
    ]
    for c in candidates:
        try_register(torch, c)

    print("\nAttempting to load YOLO model now...")
    try:
        model = YOLO("yolov8n-pose.pt")
        print("Model load succeeded. Model:", type(model))
    except Exception as e:
        print("Model load failed with exception:")
        traceback.print_exc()

if __name__ == "__main__":
    main()