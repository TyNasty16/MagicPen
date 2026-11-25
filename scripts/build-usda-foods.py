"""Builds public/data/usda-foods.json from USDA FoodData Central "Survey Foods (FNDDS)" CSVs.

Usage: python3 -I scripts/build-usda-foods.py <unzipped FoodData_Central_survey_food_csv_DIR> <release-date>
Download: https://fdc.nal.usda.gov/download-datasets (Survey Foods, CSV). Public domain (CC0).
Each row: [name, kcal, protein g, carbs g, fat g, fiber g] per 100 g, then up to 4 [portion, grams].
"""
import collections, csv, json, os, sys

src, release = sys.argv[1], sys.argv[2]
# FNDDS food_nutrient uses the legacy nutrient numbers.
WANT = {'208': 0, '203': 1, '205': 2, '204': 3, '291': 4}

foods = {r['fdc_id']: r['description'].strip() for r in csv.DictReader(open(os.path.join(src, 'food.csv'), encoding='utf-8'))}
nut = collections.defaultdict(lambda: [None] * 5)
for r in csv.DictReader(open(os.path.join(src, 'food_nutrient.csv'), encoding='utf-8')):
    i = WANT.get(r['nutrient_id'])
    if i is not None and r['fdc_id'] in foods:
        nut[r['fdc_id']][i] = float(r['amount'])
portions = collections.defaultdict(list)
for r in csv.DictReader(open(os.path.join(src, 'food_portion.csv'), encoding='utf-8')):
    g, d = round(float(r['gram_weight'] or 0), 1), r['portion_description'].strip()
    # Skip unusable portions: zero weight after rounding, "Quantity not specified", recipe "Guideline amount" rows.
    if g > 0 and d and 'not specified' not in d.lower() and not d.startswith('Guideline') and len(portions[r['fdc_id']]) < 4:
        portions[r['fdc_id']].append([d, g])

rows = []
for fid, name in foods.items():
    n = nut[fid]
    if n[0] is None:
        continue
    rows.append([name] + [round(x or 0, 1) for x in n] + portions[fid])
rows.sort(key=lambda r: r[0].lower())

# Validate before writing: a bad file must never ship.
for r in rows:
    assert r[0], r
    assert all(isinstance(x, (int, float)) and x >= 0 for x in r[1:6]), r
    assert all(p[0] and p[1] > 0 for p in r[6:]), r
assert len(rows) > 1000, len(rows)

out = {'source': 'USDA FoodData Central, Survey Foods (FNDDS)', 'release': release, 'license': 'Public domain (CC0 1.0)', 'foods': rows}
with open('public/data/usda-foods.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
print(len(rows), 'foods written')
