# Count Number of Storms by Category
import pandas as pd
import matplotlib.pyplot as plt

hurdat2 = pd.read_csv('hur.csv')

# Count Number of Storms by Category
def StormCountByCategory(hurdat2):
  grouped = hurdat2.groupby('Cat')['StormID'].unique().to_frame().reset_index()
  grouped['Num'] = grouped['StormID'].str.len()
  grouped.plot.bar(x='Cat', y='Num')
  plt.ylabel('Number of Storms')


StormCountByCategory(hurdat2)