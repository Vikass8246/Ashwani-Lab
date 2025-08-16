
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Crosshair } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { firebaseConfig } from '@/lib/firebase/config';

interface CenterLocation {
  latitude: number;
  longitude: number;
}

const mapContainerStyle = {
  height: '400px',
  width: '100%',
  borderRadius: 'var(--radius)',
};

const defaultCenter = {
  lat: 20.5937, // Default center of India
  lng: 78.9629,
};

export function LocationSettings() {
  const [markerPosition, setMarkerPosition] = useState<CenterLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();


  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: firebaseConfig.browserKey || firebaseConfig.apiKey || "",
    libraries: ["marker"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      setIsFetching(true);
      const db = getDb();
      const locationDocRef = doc(db, 'ashwani/data/config/location');
      try {
        const docSnap = await getDoc(locationDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as CenterLocation;
          setMarkerPosition(data);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        toast({ title: "Error", description: "Could not fetch location settings.", variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    };
    fetchLocation();
  }, [toast]);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setMarkerPosition({
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      });
    }
  }, []);

  const handleSave = async () => {
    if (!markerPosition) {
      toast({ title: 'No Location Set', description: 'Please select a location on the map first.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const db = getDb();
    const locationDocRef = doc(db, 'ashwani/data/config/location');
    try {
      await setDoc(locationDocRef, markerPosition);
      toast({ title: 'Settings Saved', description: 'Center location has been updated successfully.' });
    } catch (error) {
      console.error("Error saving location:", error);
      toast({ title: 'Error', description: 'Failed to save location settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setMarkerPosition({ latitude, longitude });
          if (map) {
            map.panTo(newPos);
            map.setZoom(15);
          }
        },
        () => {
          toast({
            title: 'Geolocation Error',
            description: 'Could not retrieve your location. Please ensure you have enabled location services for your browser.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({ title: 'Unsupported', description: 'Geolocation is not supported by this browser.', variant: 'destructive' });
    }
  };
  
  const mapCenter = markerPosition 
    ? { lat: markerPosition.latitude, lng: markerPosition.longitude } 
    : defaultCenter;

  const renderMap = () => {
    if (loadError) {
      const isActivationError = loadError.message.includes("ApiNotActivatedMapError");
      const isKeyError = loadError.message.includes("InvalidKeyMapError");

      return (
         <div className="flex flex-col text-center justify-center items-center h-[400px] bg-destructive/10 text-destructive border border-destructive rounded-md p-4">
            <p className="font-bold text-lg mb-2">Error Loading Map</p>
            {isActivationError ? (
              <>
                <p>The Google Maps JavaScript API is not enabled for this project.</p>
                <p className="mt-2 text-xs">Please go to the Google Cloud Console, select your project, and enable the "Maps JavaScript API".</p>
              </>
            ) : isKeyError ? (
                <>
                  <p>The provided Google Maps API key is invalid.</p>
                  <p className="mt-2 text-xs">Please check the 'browserKey' in your Firebase configuration file.</p>
                </>
            ) : (
              <p>An unknown error occurred. Please check the browser console for more details.</p>
            )}
         </div>
      );
    }
    if (!isLoaded || isFetching) return <div className="flex justify-center items-center h-[400px] bg-muted rounded-md"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    
    return (
        <GoogleMap
          id="location-map"
          mapContainerStyle={mapContainerStyle}
          zoom={markerPosition ? 15 : 5}
          center={mapCenter}
          onClick={onMapClick}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
        >
          {markerPosition && <Marker position={{ lat: markerPosition.latitude, lng: markerPosition.longitude }} />}
        </GoogleMap>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Center Location Settings</CardTitle>
        <CardDescription>
          Click on the map to place a pin at the precise location of the diagnostic center. This will be used to validate staff attendance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {renderMap()}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="text"
                  value={markerPosition?.latitude.toFixed(6) || ''}
                  readOnly
                  placeholder="Select a location on the map"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="text"
                  value={markerPosition?.longitude.toFixed(6) || ''}
                  readOnly
                  placeholder="Select a location on the map"
                />
              </div>
            </div>
            <div className="flex justify-end items-center pt-4 gap-2">
              <Button onClick={handleGoToCurrentLocation} disabled={isLoading || isFetching || !!loadError} variant="outline">
                <Crosshair className="mr-2 h-4 w-4" />
                Find My Location
              </Button>
              <Button onClick={handleSave} disabled={isLoading || isFetching || !markerPosition || !!loadError}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Location
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
