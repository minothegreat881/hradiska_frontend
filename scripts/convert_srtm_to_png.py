"""
Convert SRTM GeoTIFF to PNG heightmap for Three.js
Crops to Slovakia boundaries and normalizes elevation values
"""

import rasterio
from rasterio.windows import from_bounds
import numpy as np
from PIL import Image
import os

# Slovakia approximate bounding box
SLOVAKIA_BOUNDS = {
    'west': 16.8,
    'east': 22.6,
    'south': 47.7,
    'north': 49.6
}

def convert_srtm_to_heightmap(input_path, output_path, target_size=(2048, 1024)):
    """Convert SRTM GeoTIFF to grayscale PNG heightmap"""

    print(f"Reading SRTM file: {input_path}")

    with rasterio.open(input_path) as src:
        # Get the window for Slovakia bounds
        window = from_bounds(
            SLOVAKIA_BOUNDS['west'],
            SLOVAKIA_BOUNDS['south'],
            SLOVAKIA_BOUNDS['east'],
            SLOVAKIA_BOUNDS['north'],
            src.transform
        )

        print(f"Source CRS: {src.crs}")
        print(f"Source bounds: {src.bounds}")
        print(f"Window for Slovakia: {window}")

        # Read the data for Slovakia region
        data = src.read(1, window=window)

        print(f"Data shape: {data.shape}")
        print(f"Data range: {data.min()} to {data.max()}")

        # Handle nodata values (typically -32768 for SRTM)
        nodata = src.nodata if src.nodata is not None else -32768
        data = np.where(data == nodata, 0, data)
        data = np.where(data < 0, 0, data)  # Replace negative values with 0

        # Get actual min/max for Slovakia (ignoring sea level)
        valid_data = data[data > 0]
        if len(valid_data) > 0:
            min_elev = valid_data.min()
            max_elev = valid_data.max()
        else:
            min_elev = 0
            max_elev = 2655  # Gerlach peak

        print(f"Slovakia elevation range: {min_elev}m to {max_elev}m")

        # Normalize to 0-255 range
        # Use fixed range: 0-3000m for better visualization
        normalized = (data - 0) / (3000 - 0)
        normalized = np.clip(normalized, 0, 1)
        heightmap = (normalized * 255).astype(np.uint8)

        # Flip vertically (GeoTIFF is top-to-bottom, we need bottom-to-top for WebGL)
        heightmap = np.flipud(heightmap)

        # Create PIL Image and resize
        img = Image.fromarray(heightmap, mode='L')
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)

        # Save PNG
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img_resized.save(output_path, 'PNG')

        print(f"Heightmap saved to: {output_path}")
        print(f"Output size: {target_size}")

        return True

def create_colored_terrain(heightmap_path, output_path):
    """Create a colored terrain visualization (hypsometric tints)"""

    img = Image.open(heightmap_path).convert('L')
    heightmap = np.array(img)

    # Create RGB image with hypsometric coloring
    h, w = heightmap.shape
    colored = np.zeros((h, w, 3), dtype=np.uint8)

    # Define elevation color bands (normalized 0-255)
    # Green lowlands -> Yellow hills -> Brown mountains -> White peaks
    for i in range(h):
        for j in range(w):
            v = heightmap[i, j]
            if v < 30:  # Very low / water
                colored[i, j] = [70, 130, 100]  # Dark green
            elif v < 60:  # Lowlands
                colored[i, j] = [120, 160, 90]  # Green
            elif v < 90:  # Low hills
                colored[i, j] = [180, 190, 100]  # Yellow-green
            elif v < 120:  # Hills
                colored[i, j] = [200, 180, 100]  # Yellow-brown
            elif v < 160:  # Mountains
                colored[i, j] = [160, 120, 80]  # Brown
            elif v < 200:  # High mountains
                colored[i, j] = [130, 100, 80]  # Dark brown
            else:  # Peaks
                colored[i, j] = [220, 220, 230]  # Snow white

    colored_img = Image.fromarray(colored, mode='RGB')
    colored_img.save(output_path, 'PNG')
    print(f"Colored terrain saved to: {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    input_file = os.path.join(project_dir, "public", "heightmaps", "srtm_40_03.tif")
    output_heightmap = os.path.join(project_dir, "public", "heightmaps", "slovakia_heightmap.png")
    output_colored = os.path.join(project_dir, "public", "heightmaps", "slovakia_terrain.png")

    if not os.path.exists(input_file):
        print(f"ERROR: Input file not found: {input_file}")
        exit(1)

    # Convert to heightmap
    success = convert_srtm_to_heightmap(input_file, output_heightmap)

    if success:
        # Create colored version
        create_colored_terrain(output_heightmap, output_colored)
        print("\nConversion complete!")
