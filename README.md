# Diabetes Risk Factors

Interactive information visualization project by Amelia Tuttle and Zoey Zhang.

This project explores diabetes risk factors using the CDC BRFSS 2015 Diabetes Health Indicators dataset. The visualization includes a correlation heatmap, linked grouped bar chart, age filtering, dropdown-based subgroup comparison, and a parallel coordinates plot.

## Features

- Correlation heatmap of health, lifestyle, demographic, and socioeconomic variables
- Clickable heatmap rows that update the grouped bar chart
- Grouped bar chart showing diabetes prevalence by income bracket
- Dropdown control for comparing variables such as physical activity and smoking
- Age range filter
- Parallel coordinates plot for exploring multi-variable patterns
- Tooltips and coordinated interactions

## Dataset

Diabetes Health Indicators Dataset (BRFSS 2015)  
Source: [Kaggle Dataset](https://www.kaggle.com/datasets/alexteboul/diabetes-health-indicators-dataset)

## Tech Stack

- Next.js
- React
- D3.js
- Python preprocessing

## Run Locally

```bash
npm install
npm run dev