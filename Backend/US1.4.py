import pandas as pd
import matplotlib.pyplot as plt

# Load the temperature data (make sure the file path is correct)
df = pd.read_csv("US1.4_Data.csv")

# Define the x-axis labels (months)
months = df["Month"]
periods = ["2020-2039", "2040-2059", "2060-2079", "2080-2099"]

# Set up the plot size
plt.figure(figsize=(12, 6))

# Choose a color for each period
colors = ["orange", "deepskyblue", "mediumseagreen", "gold"]

# Plot each period as a separate line
for i, period in enumerate(periods):
    plt.plot(months, df[period], label=period, color=colors[i], marker='o')

# Add title and axis labels
plt.title("Victoria Monthly Mean Temperature by Climate Period")
plt.xlabel("Month")
plt.ylabel("Mean Temperature (°„C)")
plt.xticks(rotation=45)

# Add a legend to explain the lines
plt.legend(title="Period")

# Turn off background grid lines
plt.grid(False)

# Adjust layout to fit everything nicely
plt.tight_layout()

# Show the final plot
plt.show()

