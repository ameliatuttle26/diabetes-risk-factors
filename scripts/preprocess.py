import pandas as pd
import json
from pathlib import Path


# Paths

RAW_DATA_PATH = Path("data/diabetes_012_health_indicators_BRFSS2015.csv")
OUTPUT_DIR = Path("public/data")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# Load data

df = pd.read_csv(RAW_DATA_PATH)

# Label mappings

diabetes_map = {
    0: "No Diabetes",
    1: "Prediabetes",
    2: "Diabetes"
}

binary_map = {
    0: "No",
    1: "Yes"
}

sex_map = {
    0: "Female",
    1: "Male"
}

income_map = {
    1: "Less than $10k",
    2: "$10k-$15k",
    3: "$15k-$20k",
    4: "$20k-$25k",
    5: "$25k-$35k",
    6: "$35k-$50k",
    7: "$50k-$75k",
    8: "$75k or more"
}

education_map = {
    1: "Never attended / Kindergarten",
    2: "Elementary",
    3: "Some high school",
    4: "High school graduate",
    5: "Some college",
    6: "College graduate"
}

age_map = {
    1: "18-24",
    2: "25-29",
    3: "30-34",
    4: "35-39",
    5: "40-44",
    6: "45-49",
    7: "50-54",
    8: "55-59",
    9: "60-64",
    10: "65-69",
    11: "70-74",
    12: "75-79",
    13: "80+"
}


# Create readable columns

df_clean = df.copy()

df_clean["diabetes_label"] = df_clean["Diabetes_012"].map(diabetes_map)
df_clean["Income_label"] = df_clean["Income"].map(income_map)
df_clean["Education_label"] = df_clean["Education"].map(education_map)
df_clean["Age_label"] = df_clean["Age"].map(age_map)
df_clean["Sex_label"] = df_clean["Sex"].map(sex_map)

binary_columns = [
    "HighBP",
    "HighChol",
    "CholCheck",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "DiffWalk"
]

for col in binary_columns:
    df_clean[f"{col}_label"] = df_clean[col].map(binary_map)


# BMI bins

df_clean["BMI_group"] = pd.cut(
    df_clean["BMI"],
    bins=[0, 18.5, 25, 30, 100],
    labels=["Underweight", "Normal", "Overweight", "Obese"]
)

# 1. Correlations JSON

feature_columns = [
    "HighBP",
    "HighChol",
    "BMI",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk",
    "Sex",
    "Age",
    "Education",
    "Income"
]

correlations = []

for col in feature_columns:
    corr = df_clean[col].corr(df_clean["Diabetes_012"])
    correlations.append({
        "variable": col,
        "correlation": round(float(corr), 4),
        "absCorrelation": round(abs(float(corr)), 4)
    })

correlations = sorted(
    correlations,
    key=lambda x: x["absCorrelation"],
    reverse=True
)

with open(OUTPUT_DIR / "correlations.json", "w") as f:
    json.dump(correlations, f, indent=2)


# 2. Prevalence JSON
# Diabetes prevalence by income + group variable

group_variables = [
    "PhysActivity",
    "Smoker",
    "HighBP",
    "HighChol",
    "Sex",
    "DiffWalk",
    "HeartDiseaseorAttack"
]

prevalence_data = []

for group_var in group_variables:
    grouped = (
        df_clean
        .groupby(["Income", "Income_label", group_var])
        .agg(
            total=("Diabetes_012", "count"),
            diabetes_count=("Diabetes_012", lambda x: (x == 2).sum()),
            prediabetes_count=("Diabetes_012", lambda x: (x == 1).sum())
        )
        .reset_index()
    )

    grouped["diabetes_prevalence"] = (
        grouped["diabetes_count"] / grouped["total"] * 100
    )

    grouped["prediabetes_prevalence"] = (
        grouped["prediabetes_count"] / grouped["total"] * 100
    )

    for _, row in grouped.iterrows():
        value = row[group_var]

        if group_var == "Sex":
            value_label = sex_map.get(int(value), str(value))
        else:
            value_label = binary_map.get(int(value), str(value))

        prevalence_data.append({
            "groupBy": group_var,
            "income": int(row["Income"]),
            "incomeLabel": row["Income_label"],
            "groupValue": int(value),
            "groupLabel": value_label,
            "total": int(row["total"]),
            "diabetesCount": int(row["diabetes_count"]),
            "prediabetesCount": int(row["prediabetes_count"]),
            "diabetesPrevalence": round(float(row["diabetes_prevalence"]), 2),
            "prediabetesPrevalence": round(float(row["prediabetes_prevalence"]), 2)
        })

with open(OUTPUT_DIR / "prevalence.json", "w") as f:
    json.dump(prevalence_data, f, indent=2)


# 3. Parallel Coordinates Sample JSON

pcp_columns = [
    "Diabetes_012",
    "diabetes_label",
    "BMI",
    "Income",
    "Income_label",
    "Age",
    "Age_label",
    "HighBP",
    "HighChol",
    "PhysActivity",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk"
]

pcp_sample = (
    df_clean[pcp_columns]
    .sample(n=1500, random_state=42)
    .to_dict(orient="records")
)

with open(OUTPUT_DIR / "pcp_sample.json", "w") as f:
    json.dump(pcp_sample, f, indent=2)


# 4. Metadata JSON

metadata = {
    "totalRows": int(len(df_clean)),
    "features": feature_columns,
    "groupVariables": group_variables,
    "incomeLabels": income_map,
    "ageLabels": age_map,
    "diabetesLabels": diabetes_map
}

with open(OUTPUT_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("Preprocessing complete.")
print(f"Saved files to: {OUTPUT_DIR}")
print("- correlations.json")
print("- prevalence.json")
print("- pcp_sample.json")
print("- metadata.json")