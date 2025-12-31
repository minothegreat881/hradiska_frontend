"""
Merge SRTM GeoTIFF files and create Slovakia heightmap
Combines western (srtm_40_03) and eastern (srtm_41_03) tiles
"""

import rasterio
from rasterio.merge import merge
from rasterio.windows import from_bounds
from rasterio.transform import from_bounds as transform_from_bounds
import numpy as np
from PIL import Image
import os

# Slovakia exact bounding box
SLOVAKIA_BOUNDS = {
    'west': 16.833,
    'east': 22.567,
    'south': 47.733,
    'north': 49.617
}

def merge_and_crop_srtm(input_files, output_path, target_size=(2048, 1024)):
    """Merge multiple SRTM files and crop to Slovakia bounds"""

    print("Opening SRTM files...")
    datasets = [rasterio.open(f) for f in input_files]

    print(f"File 1 bounds: {datasets[0].bounds}")
    print(f"File 2 bounds: {datasets[1].bounds}")

    # Merge datasets
    print("Merging datasets...")
    mosaic, mosaic_transform = merge(datasets)

    # Get the merged data
    merged_data = mosaic[0]  # First band
    print(f"Merged shape: {merged_data.shape}")

    # Calculate pixel coordinates for Slovakia bounds
    # Transform from geo coordinates to pixel coordinates
    inv_transform = ~mosaic_transform

    west_px, north_px = inv_transform * (SLOVAKIA_BOUNDS['west'], SLOVAKIA_BOUNDS['north'])
    east_px, south_px = inv_transform * (SLOVAKIA_BOUNDS['east'], SLOVAKIA_BOUNDS['south'])

    # Convert to integers and ensure valid bounds
    col_start = max(0, int(west_px))
    col_end = min(merged_data.shape[1], int(east_px))
    row_start = max(0, int(north_px))
    row_end = min(merged_data.shape[0], int(south_px))

    print(f"Cropping to pixels: rows {row_start}:{row_end}, cols {col_start}:{col_end}")

    # Crop to Slovakia
    slovakia_data = merged_data[row_start:row_end, col_start:col_end]
    print(f"Slovakia crop shape: {slovakia_data.shape}")

    # Handle nodata values
    slovakia_data = np.where(slovakia_data < 0, 0, slovakia_data)

    # Get elevation range
    valid_data = slovakia_data[slovakia_data > 0]
    min_elev = valid_data.min() if len(valid_data) > 0 else 0
    max_elev = valid_data.max() if len(valid_data) > 0 else 2655
    print(f"Elevation range: {min_elev}m to {max_elev}m")

    # Normalize to 0-255 (use 0-3000m range for good contrast)
    normalized = slovakia_data / 3000.0
    normalized = np.clip(normalized, 0, 1)
    heightmap = (normalized * 255).astype(np.uint8)

    # Create PIL Image
    img = Image.fromarray(heightmap)

    # Resize to target size
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img_resized.save(output_path, 'PNG')
    print(f"Heightmap saved: {output_path} ({target_size[0]}x{target_size[1]})")

    # Close datasets
    for ds in datasets:
        ds.close()

    return heightmap, target_size

def create_hypsometric_colormap():
    """Create classic hypsometric color gradient"""
    # Colors from low to high elevation (green -> yellow -> brown -> white)
    colors = [
        (68, 120, 89),    # Dark green - valleys (0m)
        (94, 140, 90),    # Green - lowlands
        (144, 175, 100),  # Yellow-green - low hills
        (190, 185, 120),  # Yellow - hills
        (195, 160, 105),  # Tan - foothills
        (165, 120, 80),   # Brown - mountains
        (140, 100, 75),   # Dark brown - high mountains
        (180, 175, 170),  # Gray - alpine
        (220, 220, 225),  # Light gray - high peaks
        (255, 255, 255),  # White - snow
    ]
    return colors

def create_colored_terrain(heightmap_path, output_path):
    """Create hypsometric colored terrain map"""

    img = Image.open(heightmap_path).convert('L')
    heightmap = np.array(img)
    h, w = heightmap.shape

    colors = create_hypsometric_colormap()
    n_colors = len(colors)

    # Create RGB output
    colored = np.zeros((h, w, 3), dtype=np.uint8)

    # Vectorized color interpolation
    for i in range(n_colors - 1):
        low_thresh = int(255 * i / (n_colors - 1))
        high_thresh = int(255 * (i + 1) / (n_colors - 1))

        mask = (heightmap >= low_thresh) & (heightmap < high_thresh)
        if not np.any(mask):
            continue

        # Interpolation factor
        t = (heightmap[mask] - low_thresh) / max(1, (high_thresh - low_thresh))

        for c in range(3):
            colored[mask, c] = (
                colors[i][c] * (1 - t) + colors[i + 1][c] * t
            ).astype(np.uint8)

    # Handle max values
    colored[heightmap >= 255] = colors[-1]

    # Save
    Image.fromarray(colored).save(output_path, 'PNG')
    print(f"Colored terrain saved: {output_path}")

def create_hillshade(heightmap_path, output_path, azimuth=315, altitude=45):
    """Create hillshade for 3D effect"""

    img = Image.open(heightmap_path).convert('L')
    dem = np.array(img, dtype=float)

    # Calculate gradients
    dx = np.gradient(dem, axis=1)
    dy = np.gradient(dem, axis=0)

    # Convert angles to radians
    azimuth_rad = np.radians(azimuth)
    altitude_rad = np.radians(altitude)

    # Calculate hillshade
    slope = np.arctan(np.sqrt(dx**2 + dy**2))
    aspect = np.arctan2(-dx, dy)

    hillshade = (
        np.sin(altitude_rad) * np.cos(slope) +
        np.cos(altitude_rad) * np.sin(slope) * np.cos(azimuth_rad - aspect)
    )

    # Normalize to 0-255
    hillshade = ((hillshade + 1) / 2 * 255).astype(np.uint8)

    Image.fromarray(hillshade).save(output_path, 'PNG')
    print(f"Hillshade saved: {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    heightmaps_dir = os.path.join(project_dir, "public", "heightmaps")

    # Input files
    srtm_files = [
        os.path.join(heightmaps_dir, "srtm_40_03.tif"),
        os.path.join(heightmaps_dir, "srtm_41_03.tif")
    ]

    # Check files exist
    for f in srtm_files:
        if not os.path.exists(f):
            print(f"ERROR: File not found: {f}")
            exit(1)

    # Output files
    heightmap_path = os.path.join(heightmaps_dir, "slovakia_heightmap.png")
    colored_path = os.path.join(heightmaps_dir, "slovakia_colored.png")
    hillshade_path = os.path.join(heightmaps_dir, "slovakia_hillshade.png")

    # Process
    print("=" * 50)
    print("Creating Slovakia heightmap from SRTM data")
    print("=" * 50)

    merge_and_crop_srtm(srtm_files, heightmap_path)
    create_colored_terrain(heightmap_path, colored_path)
    create_hillshade(heightmap_path, hillshade_path)

    print("\n✓ All files created successfully!")
    print(f"  - {heightmap_path}")
    print(f"  - {colored_path}")
    print(f"  - {hillshade_path}")
