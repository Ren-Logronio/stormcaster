import matplotlib.pyplot as plt
import shapefile   

shpFilePath = "./Datasets/UNISYS_tracks_1956_2018Dec31.shp"  
listx=[]
listy=[]
test = shapefile.Reader(shpFilePath)
for sr in test.shapeRecords():
    for xNew,yNew in sr.shape.points:
        listx.append(xNew)
        listy.append(yNew)
plt.plot(listx,listy)
plt.show()