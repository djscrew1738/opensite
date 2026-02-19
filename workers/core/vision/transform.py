def local_to_global(local_x: int, local_y: int, metadata: dict) -> tuple:
    return metadata.get("global_x", 0) + local_x, metadata.get("global_y", 0) + local_y
