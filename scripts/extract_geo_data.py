"""
Extract Slovakia border and rivers from GeoJSON files
"""
import json
import os

# Slovakia bounding box
SK_BOUNDS = {
    'west': 16.8,
    'east': 22.6,
    'south': 47.7,
    'north': 49.7
}

def point_in_slovakia(lon, lat):
    """Check if point is within Slovakia bounds"""
    return (SK_BOUNDS['west'] <= lon <= SK_BOUNDS['east'] and
            SK_BOUNDS['south'] <= lat <= SK_BOUNDS['north'])

def extract_slovakia_rivers(input_file, output_file):
    """Extract rivers that pass through Slovakia"""
    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    slovakia_rivers = []

    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        coords = geom.get('coordinates', [])

        # Check if any point of the river is in Slovakia
        is_in_slovakia = False

        if geom.get('type') == 'LineString':
            for coord in coords:
                if len(coord) >= 2 and point_in_slovakia(coord[0], coord[1]):
                    is_in_slovakia = True
                    break
        elif geom.get('type') == 'MultiLineString':
            for line in coords:
                for coord in line:
                    if len(coord) >= 2 and point_in_slovakia(coord[0], coord[1]):
                        is_in_slovakia = True
                        break
                if is_in_slovakia:
                    break

        if is_in_slovakia:
            name = feature.get('properties', {}).get('name', 'Unknown')
            slovakia_rivers.append({
                'type': 'Feature',
                'properties': {
                    'name': name,
                    'strokeWidth': feature.get('properties', {}).get('strokewidth', 1)
                },
                'geometry': geom
            })

    output_data = {
        'type': 'FeatureCollection',
        'features': slovakia_rivers
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f)

    print(f"Extracted {len(slovakia_rivers)} rivers to {output_file}")
    for river in slovakia_rivers[:10]:
        print(f"  - {river['properties']['name']}")

def simplify_border(input_file, output_file):
    """Read and simplify Slovakia border"""
    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Get coordinates from the first feature
    coords = []
    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        if geom.get('type') == 'Polygon':
            coords = geom['coordinates'][0]
        elif geom.get('type') == 'MultiPolygon':
            # Get the largest polygon
            largest = max(geom['coordinates'], key=lambda x: len(x[0]))
            coords = largest[0]

    # Simplify - keep every Nth point
    step = max(1, len(coords) // 200)
    simplified = coords[::step]
    if simplified[-1] != simplified[0]:
        simplified.append(simplified[0])

    output_data = {
        'type': 'Feature',
        'properties': {'name': 'Slovakia'},
        'geometry': {
            'type': 'Polygon',
            'coordinates': [simplified]
        }
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f)

    print(f"Border simplified to {len(simplified)} points, saved to {output_file}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    geo_dir = os.path.join(project_dir, "public", "geo")

    # Extract rivers
    rivers_input = os.path.join(geo_dir, "europe_rivers.geojson")
    rivers_output = os.path.join(geo_dir, "slovakia_rivers.json")
    if os.path.exists(rivers_input):
        extract_slovakia_rivers(rivers_input, rivers_output)

    # Simplify border
    border_input = os.path.join(geo_dir, "slovakia_admin.geojson")
    border_output = os.path.join(geo_dir, "slovakia_border.json")
    if os.path.exists(border_input):
        simplify_border(border_input, border_output)

    print("\nDone!")
