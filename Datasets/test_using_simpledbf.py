import pandas as pd
from simpledbf import Dbf5
df = Dbf5('./Datasets/UNISYS_tracks_1956_2018Dec31.dbf').to_dataframe() 
df['year'] = df['ADV_DATE'].apply(func=lambda x: x if isinstance(x, float) else int(x.year))
df['storm_number'] = df['STORM_NO'].astype(float)
df.shape
df.head()

from matplotlib.pyplot import subplots
_, ax = subplots(figsize=(12, 8))
from seaborn import scatterplot
scatterplot(ax=ax, data=df, hue='year', x='LONG_', y='LAT', )