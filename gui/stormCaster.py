import tkinter as tk
from tkinter import filedialog
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from time import sleep
from pycaret.regression import *
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.pyplot import subplots
import seaborn as sns
import numpy as np
import plotly.express as px
import folium
from folium.plugins import MarkerCluster
from folium import plugins
from folium.plugins import FloatImage
from folium.plugins import PolyLineTextPath
from mpl_toolkits.basemap import Basemap
from folium import PolyLine
from folium import Marker
from scipy import spatial
from matplotlib.path import Path
from keras.models import Sequential
from keras.layers import LSTM, Dense
from keras.initializers import RandomUniform
from sklearn.model_selection import train_test_split



class StormCasterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("StormCaster Data Analytics")
        self.root.geometry("1200x800")
        self.root.config(bg="#001F3F")  

        self.load_button = tk.Button(self.root, text="Load CSV File", command=self.load_csv, bg="#277da1", fg="white")
        self.load_button.pack(pady=20)

        self.process_button = tk.Button(self.root, state = tk.DISABLED, text="Process and Show Descriptive Analytics", command=self.process_descriptive, bg="#f76d7a", fg="white")
        self.process_button.pack(pady=5)

        self.map_button = tk.Button(self.root, state = tk.DISABLED, text="Show Map For All Storms", command=self.AllStormTracks, bg="#f76d7a", fg="white")
        self.map_button.pack(pady=5)

        self.predict_button = tk.Button(self.root, state = tk.DISABLED, text="Process and Show Predictive Analytics", command=self.process_predictive, bg="#5e7f5e", fg="white")
        self.predict_button.pack(pady=5)

        self.reset_button = tk.Button(self.root, state = tk.DISABLED, text="Reset", command=self.reset_application, bg="#5e7f5e", fg="white")
        self.reset_button.pack(pady=20)

        self.result_text = tk.Text(self.root, height=10, width=200, bg="#30475e", fg="white")
        self.result_text.pack(pady=20)

    def load_csv(self):
        file_path = filedialog.askopenfilename(filetypes=[("CSV Files", "*.csv")])
        if file_path:
            self.df = pd.read_csv(file_path)
            self.result_text.insert(tk.END, "CSV File Loaded Successfully\n")
            self.load_button['state'] = tk.DISABLED
            self.process_button['state'] = tk.NORMAL
            self.map_button['state'] = tk.NORMAL
            self.predict_button['state'] = tk.NORMAL
            self.reset_button['state'] = tk.NORMAL
         
    def process_descriptive(self):
        # Add your descriptive analytics code here
        # For example:
        descriptive_result = self.df.describe()
        self.result_text.insert(tk.END, "\nDescriptive Analytics Result:\n")
        self.result_text.insert(tk.END, str(descriptive_result) + "\n")

        grouped_by_status = self.df.groupby('STATUS')['ID'].nunique().reset_index()

        grouped_by_status.columns = ['Status', 'NumStorms']

        # Convert 'Status' to string for proper categorical ordering
        grouped_by_status['Status'] = grouped_by_status['Status'].astype('str')

        # Create a bar plot using plotly.express
        fig = px.bar(grouped_by_status, x='Status', y='NumStorms',
                    labels={'NumStorms': 'No. of Storms'},
                    title='Storm Frequency by Status')

        # Add hover text to show the number of storms for each bar
        fig.update_traces(hovertemplate='Status: %{x}<br>No. of Storms: %{y}')

        fig.show()

        grouped_by_category = self.df.groupby('CATEGORY')['ID'].nunique().reset_index()

        grouped_by_category.columns = ['Category', 'NumStorms']

        # Convert 'Category' to string for proper categorical ordering
        grouped_by_category['Category'] = grouped_by_category['Category'].astype('str')

        # Create a bar plot using plotly.express
        fig = px.bar(grouped_by_category, x='Category', y='NumStorms',
                    labels={'NumStorms': 'No. of Storms'},
                    title='Storm Frequency by Saffir-Simpson Hurricane Category Calculated from Wind Speed')

        # Add hover text to show the number of storms for each bar
        fig.update_traces(hovertemplate='Category: %{x}<br>No. of Storms: %{y}')

        # Show the plot
        fig.show()

        grouped_by_year = self.df.groupby('YEAR')['ID'].nunique().reset_index()
    
        grouped_by_year.columns = ['Year', 'NumStorms']

    # Convert 'Year' to integer
        grouped_by_year['Year'] = grouped_by_year['Year'].astype('int')
        print(grouped_by_year["NumStorms"].sum())
        # Set plot size
        plt.rcParams["figure.figsize"] = (20, 5)

        # Plot the number of storms per year
        plt.plot(grouped_by_year['Year'], grouped_by_year['NumStorms'], linewidth=3, linestyle='dashed', label='Number of Storms')
        plt.plot(grouped_by_year['Year'],grouped_by_year['NumStorms'].rolling(5).mean(),label= 'MA 5 years', linewidth=3)

        # Set x-axis ticks for each individual year
        plt.xticks(grouped_by_year['Year'])

        # Set labels and legend
        plt.xlabel('Year No.')
        plt.ylabel('No. of Storms')
        plt.legend()

        plt.show()

        
        # m = folium.Map(location=[self.df['LAT'].mean(), self.df['LONG'].mean()], zoom_start=5, tiles='OpenStreetMap')

        # # Select hurricanes
        # HurricaneStorms = self.df[self.df['STATUS'] == "Hurricane"]
        # HurricaneStorms_Unique = HurricaneStorms['NAME'].unique()
        # print('Total number of Hurricane Storms = ', len(HurricaneStorms_Unique))

        # TropicalWaves = self.df[self.df['STATUS'] == "Tropical Wave"]
        # TropicalWaves_Unique = TropicalWaves['ID'].unique()
        # print('Total number of Tropical Wave Storms = ', len(TropicalWaves_Unique))

        # print('Unique Hurricane Names:', HurricaneStorms_Unique)
        # print('Unique Tropical Wave IDs:', TropicalWaves_Unique)

        # for xstorm_name in HurricaneStorms_Unique:
        #     xtemp_db = self.df[self.df['NAME'] == xstorm_name]
        #     xlatitudes = xtemp_db['LAT'].tolist()
        #     xlongitudes = xtemp_db['LONG'].tolist()
        #     xcoordinates = list(zip(xlatitudes, xlongitudes))

        #     # Add a PolyLine to the map for the storm track
        #     PolyLine(xcoordinates, color='red', weight=0.5, opacity=0.7, popup=xstorm_name).add_to(m)

        # # Iterate over each hurricane storm
        # for ystorm_name in TropicalWaves_Unique:
        #     ytemp_db = self.df[self.df['NAME'] == ystorm_name]
        #     ylatitudes = ytemp_db['LAT'].tolist()
        #     ylongitudes = ytemp_db['LONG'].tolist()
        #     ycoordinates = list(zip(ylatitudes, ylongitudes))

        #     # Add a PolyLine to the map for the storm track
        #     PolyLine(ycoordinates, color='blue', weight=0.5, opacity=0.7, popup=ystorm_name).add_to(m)

    # Helper function for Plotting BaseMaps


    # Storm Track of All Storms in Atlantic
    def AllStormTracks(self):

        plt.figure(figsize=(10, 8))
        m1 = Basemap(llcrnrlon=-100.,llcrnrlat=0.,urcrnrlon=30.,urcrnrlat=57.,projection='lcc',lat_1=20.,lat_2=40.,lon_0=-60.,resolution ='l',area_thresh=1000.)    
        m1.drawcoastlines()
        m1.drawparallels(np.arange(10,70,10),labels=[1,1,0,0])
        m1.drawmeridians(np.arange(-100,0,10),labels=[0,0,0,1])
        plt.suptitle("Atlantic Historical Storms (2001-2022)", fontsize=16)
        for stormid, track in self.df.groupby('ID'):
            lat_storm = track.LAT.values
            lon_storm = track.LONG.values
            x1, y1 = m1(lon_storm,lat_storm)
            plt.plot(x1,y1,'r-',linewidth=0.5)
        plt.show()

        

    def process_predictive(self):

        # Convert YEAR and MONTH columns to datetime format
        self.df['DATE'] = pd.to_datetime(self.df[['YEAR', 'MONTH']].assign(DAY=1))

        # Count the unique IDs each month per year
        unique_id_counts = self.df.groupby(['YEAR', 'MONTH'])['ID'].nunique().reset_index(name='NUMBER_OF_STORMS')

        # Group by year and count the number of unique storms
        grouped_by_year = unique_id_counts.groupby('YEAR')['NUMBER_OF_STORMS'].sum().reset_index()

        # Set plot size
        plt.rcParams["figure.figsize"] = (20, 5)

        # Plot the number of storms per year
        plt.plot(grouped_by_year['YEAR'], grouped_by_year['NUMBER_OF_STORMS'], linewidth=3, linestyle='dashed', marker='o', label='Number of Storms')

        # Set x-axis ticks for each individual year
        plt.xticks(grouped_by_year['YEAR'])

        # Set labels and legend
        plt.xlabel('Year')
        plt.ylabel('Number of Storms')
        plt.legend()

        # Show the plot
        plt.show()

        # create a sequence of numbers
        unique_id_counts['SERIES'] = np.arange(1,len(unique_id_counts)+1)

        data = unique_id_counts[["SERIES", "YEAR", "MONTH", "NUMBER_OF_STORMS"]]

        # split data into train-test set
        train = data[data['YEAR'] < 2016]
        test = data[data['YEAR'] >= 2016]

        # check shape
        train.shape, test.shape
        s = setup(data = train, test_data = test, target = 'NUMBER_OF_STORMS', fold_strategy = 'timeseries', data_split_shuffle = False, fold_shuffle = False, numeric_features = ['YEAR', 'SERIES'], fold = 3, transform_target = True, session_id = 123)
        best = compare_models(sort = 'MAE')

        future_dates = pd.date_range(start = '2023-01-01', end = '2024-01-01', freq = 'MS')
        future_df = pd.DataFrame()
        future_df['MONTH'] = [i.month for i in future_dates]
        future_df['YEAR'] = [i.year for i in future_dates]    
        future_df['SERIES'] = np.arange(139,(139+len(future_dates)))
        predictions_future = predict_model(best, data=future_df)
        predictions_future = predictions_future.rename(columns={'prediction_label': 'NUMBER_OF_STORMS'})

        # Concatenate the two DataFrames
        merged_df = pd.concat([data, predictions_future], keys=['Actual', 'Predicted'])

        # Group by year and sum the 'Open' column
        grouped_by_year = merged_df.groupby('YEAR')['NUMBER_OF_STORMS'].sum().reset_index()

        # Plotting
        plt.figure(figsize=(20, 5))

        plt.plot(grouped_by_year['YEAR'], grouped_by_year['NUMBER_OF_STORMS'], linewidth=3, linestyle='dashed', marker='o', label='Number of Storms')

        # Set x-axis ticks for each individual year
        plt.xticks(grouped_by_year['YEAR'])

        # Set labels and legend
        plt.xlabel('YEAR')
        plt.ylabel('Number of Storms')
        plt.legend()

        # Show the plot
        plt.show()

        self.result_text.delete("1.0","end")
        self.result_text.insert(tk.END, "\n Dataset has successfully trained \n")
    
    def reset_application(self):
        # Add your reset logic here
        # For demonstration, let's create a new root window
        
        # Destroy the existing root window
        self.root.destroy()
        
        # Create a new root window
        new_root = tk.Tk()
        new_root.title("Reset Application")
        # Add your widgets and configurations for the new window
        new_app = StormCasterApp(new_root)
        
        # Run the Tkinter event loop
        new_root.mainloop()

if __name__ == "__main__":
    root = tk.Tk()
    app = StormCasterApp(root)
    root.mainloop()
