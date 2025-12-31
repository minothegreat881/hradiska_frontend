"""
Extract Slovakia border and create rivers GeoJSON
"""
import json
import os

# Slovakia border coordinates (simplified polygon)
# Based on actual geographic coordinates
SLOVAKIA_BORDER = {
    "type": "Feature",
    "properties": {"name": "Slovakia"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [17.1607, 48.0077],  # SW near Bratislava
            [16.8467, 48.3537],  # W border
            [16.9467, 48.6187],  # NW
            [17.1537, 48.8557],  # N border start
            [17.7587, 49.0187],
            [18.1607, 49.2577],
            [18.5627, 49.4987],  # N Zilina area
            [18.8507, 49.5177],
            [19.1447, 49.4007],
            [19.4417, 49.5977],  # Tatry area
            [19.7747, 49.2107],
            [20.0717, 49.1837],
            [20.3677, 49.3847],
            [20.6137, 49.3957],
            [20.8287, 49.3287],
            [21.0787, 49.4187],
            [21.4527, 49.4127],
            [21.6397, 49.4117],
            [22.1377, 49.0877],  # NE corner
            [22.5587, 49.0857],
            [22.5387, 48.9907],  # E border
            [22.1557, 48.4017],
            [21.7677, 48.3387],
            [21.4507, 48.5627],
            [21.1257, 48.4337],
            [20.8257, 48.5767],
            [20.4917, 48.5297],
            [20.3307, 48.2657],
            [19.9527, 48.1317],
            [19.5017, 48.1667],
            [19.0147, 48.0777],
            [18.7697, 47.8807],
            [18.6577, 47.7587],
            [18.1597, 47.7687],
            [17.8497, 47.7577],
            [17.4847, 47.8647],
            [17.1607, 48.0077],  # Back to start
        ]]
    }
}

# Main Slovak rivers with their coordinates
SLOVAKIA_RIVERS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"name": "Dunaj", "type": "major"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [17.1007, 48.1427],  # Bratislava
                    [17.2607, 48.0177],
                    [17.5507, 47.8927],
                    [17.8507, 47.7577],
                    [18.1507, 47.7687],
                    [18.7457, 47.8057],  # Komarno area
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Vah", "type": "major"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [17.2007, 48.1377],  # Confluence with Dunaj
                    [17.5857, 48.3737],  # Piestany
                    [17.8357, 48.5837],  # Trencin
                    [18.1597, 48.7237],
                    [18.4457, 48.8887],  # Zilina
                    [18.7407, 49.0257],
                    [19.0567, 49.0657],  # Ruzomberok area
                    [19.3367, 49.0707],  # Liptovsky Mikulas
                    [19.6347, 49.0777],
                    [19.9707, 49.0527],  # Source area
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Hron", "type": "major"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [18.7457, 47.8057],  # Confluence (Sturovo)
                    [18.6257, 48.0757],
                    [18.6657, 48.2357],  # Levice
                    [18.7757, 48.4557],  # Zvolen
                    [19.1457, 48.7357],  # Banska Bystrica
                    [19.4557, 48.8757],  # Upper Hron
                    [19.7057, 48.8557],
                    [20.0157, 48.8157],  # Source
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Morava", "type": "major"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [16.9467, 48.6187],  # North
                    [16.9367, 48.4637],
                    [16.9267, 48.2837],
                    [16.9667, 48.1037],  # Confluence with Dunaj
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Hornad", "type": "major"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [21.2557, 48.7157],  # Kosice area
                    [21.0057, 48.8557],
                    [20.7757, 48.9357],
                    [20.4557, 49.0157],  # Spisska Nova Ves
                    [20.2557, 49.0657],
                    [20.0857, 49.0157],  # Source near Tatry
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Poprad", "type": "medium"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [20.6507, 49.2957],  # Towards Poland
                    [20.4507, 49.0557],  # Poprad city
                    [20.2507, 49.0757],
                    [20.0507, 49.1057],  # Tatry
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Bodrog", "type": "medium"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [21.7677, 48.3387],  # To Hungary
                    [21.5577, 48.4387],
                    [21.3577, 48.5387],
                    [21.2057, 48.5857],  # Trebisov area
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Nitra", "type": "medium"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [18.0857, 47.9857],  # Confluence
                    [18.0857, 48.1557],  # Nitra city
                    [18.0857, 48.3057],
                    [18.1357, 48.5557],  # Upper Nitra
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Orava", "type": "medium"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [19.3367, 49.0707],  # Confluence with Vah
                    [19.3867, 49.2007],
                    [19.4367, 49.3507],  # Oravska priehrada
                    [19.5067, 49.4507],  # Towards Poland
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {"name": "Laborec", "type": "medium"},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [21.7677, 48.3387],  # South
                    [21.6577, 48.5787],
                    [21.6577, 48.7787],  # Humenne
                    [21.8577, 48.9787],  # North
                ]
            }
        }
    ]
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, "public", "geo")

    os.makedirs(data_dir, exist_ok=True)

    # Save border
    border_path = os.path.join(data_dir, "slovakia_border.json")
    with open(border_path, 'w', encoding='utf-8') as f:
        json.dump(SLOVAKIA_BORDER, f)
    print(f"Border saved: {border_path}")

    # Save rivers
    rivers_path = os.path.join(data_dir, "slovakia_rivers.json")
    with open(rivers_path, 'w', encoding='utf-8') as f:
        json.dump(SLOVAKIA_RIVERS, f)
    print(f"Rivers saved: {rivers_path}")

    print("Done!")

if __name__ == "__main__":
    main()
