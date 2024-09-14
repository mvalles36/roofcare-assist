import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from '../integrations/supabase/supabase';
import axios from 'axios';
import { useLoadScript, GoogleMap, DrawingManager, Autocomplete } from '@react-google-maps/api';
import { motion } from 'framer-motion';

const libraries = ['places', 'drawing'];

const FindLeads = () => {
  const [address, setAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [leads, setLeads] = useState([]);
  const [listName, setListName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 32.7555, lng: -97.3308 }); // Fort Worth, Texas
  const [mapZoom, setMapZoom] = useState(12);
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const skipInstructions = localStorage.getItem('skipInstructions');
    if (skipInstructions === 'true') {
      setShowInstructions(false);
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  const onRectangleComplete = useCallback((rectangle) => {
    if (selectedArea) {
      selectedArea.setMap(null);
    }
    setSelectedArea(rectangle);
    drawingManagerRef.current.setDrawingMode(null);
  }, [selectedArea]);

  const onAutocompleteLoad = useCallback((autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const handlePlaceSelect = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMapCenter(newCenter);
        mapRef.current?.panTo(newCenter);
        setMapZoom(20);
        setAddress(place.formatted_address);
      }
    }
  }, []);

  const handleFindLeads = useCallback(async () => {
    if (!selectedArea) {
      alert('Please draw a rectangle on the map first.');
      return;
    }

    const bounds = selectedArea.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    try {
      const response = await axios.get('https://reversegeo.melissadata.net/v3/web/ReverseGeoCode/doLookup', {
        params: {
          id: import.meta.env.VITE_MELISSA_DATA_API_KEY,
          format: "json",
          recs: "20",
          opt: "IncludeApartments:off;IncludeUndeliverable:off;IncludeEmptyLots:off",
          bbox: `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`
        }
      });

      const processedLeads = response.data.Records
        .filter(record => {
          const latLng = new window.google.maps.LatLng(record.Latitude, record.Longitude);
          return bounds.contains(latLng);
        })
        .map(record => ({
          name: record.AddressLine1,
          address: `${record.AddressLine1}, ${record.City}, ${record.State} ${record.PostalCode}`,
          telephone: record.TelephoneNumber,
          email: record.EmailAddress,
          income: record.Income,
          coordinates: JSON.stringify({ lat: record.Latitude, lng: record.Longitude }),
        }));

      setLeads(processedLeads);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error finding leads:', error);
      alert('An error occurred while finding leads. Please try again.');
    }
  }, [selectedArea]);

  const handleSaveList = useCallback(async () => {
    if (!listName.trim()) {
      alert('Please enter a name for the list.');
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .insert(leads.map(lead => ({
          name: lead.name,
          address: lead.address,
          telephone: lead.telephone,
          email: lead.email,
          income: lead.income,
          coordinates: lead.coordinates,
          list_name: listName
        })));

      if (error) throw error;

      alert('List saved successfully!');
      setIsDialogOpen(false);
      setLeads([]);
      setListName('');
      setAddress('');
      setSelectedArea(null);
    } catch (error) {
      console.error('Error saving list:', error);
      alert('An error occurred while saving the list. Please try again.');
    }
  }, [listName, leads]);

  const instructionSteps = [
    {
      title: "Welcome to Find Leads!",
      content: "This tool helps you find leads in a specific area. Let's walk through how to use it.",
      animation: null
    },
    {
      title: "Step 1: Choose an Area",
      content: "First, navigate to the area you're interested in. You can use the search bar to find a specific address.",
      animation: (
        <motion.div
          animate={{ x: [0, 200, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-8 w-32 bg-blue-500 rounded"
        />
      )
    },
    {
      title: "Step 2: Draw a Rectangle",
      content: "Click and drag on the map to draw a rectangle around the area you want to search.",
      animation: (
        <motion.div
          initial={{ width: 0, height: 0 }}
          animate={{ width: 200, height: 100 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="border-2 border-red-500"
        />
      )
    },
    {
      title: "Step 3: Find Leads",
      content: "Click the 'Find Leads in Selected Area' button to search for leads within your selected area.",
      animation: (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="p-2 bg-green-500 rounded text-white"
        >
          Find Leads
        </motion.div>
      )
    },
    {
      title: "You're All Set!",
      content: "You now know how to use the Find Leads tool. Click 'Get Started' to begin your search.",
      animation: null
    }
  ];

  const handleNextStep = () => {
    if (currentStep < instructionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowInstructions(false);
    }
  };

  const handleCloseInstructions = () => {
    if (dontShowAgain) {
      localStorage.setItem('skipInstructions', 'true');
    }
    setShowInstructions(false);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Find Leads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Search Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={handlePlaceSelect}
            >
              <Input
                type="text"
                placeholder="Enter an address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Autocomplete>
          </div>
          <div style={{ height: '400px', width: '100%' }}>
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={mapCenter}
              zoom={mapZoom}
              onLoad={onMapLoad}
            >
              <DrawingManager
                onLoad={onDrawingManagerLoad}
                onRectangleComplete={onRectangleComplete}
                options={{
                  drawingControl: true,
                  drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [window.google.maps.drawing.OverlayType.RECTANGLE],
                  },
                  rectangleOptions: {
                    fillColor: '#FF0000',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    clickable: false,
                    editable: true,
                    zIndex: 1,
                  },
                }}
              />
            </GoogleMap>
          </div>
          <Button className="mt-4" onClick={handleFindLeads}>Find Leads in Selected Area</Button>
        </CardContent>
      </Card>

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-2xl font-bold mb-4">{instructionSteps[currentStep].title}</h2>
            <p className="mb-4">{instructionSteps[currentStep].content}</p>
            <div className="flex justify-center mb-4">
              {instructionSteps[currentStep].animation}
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="dontShowAgain">Don't show this again</label>
            </div>
            <div className="flex justify-between">
              <Button onClick={handleCloseInstructions}>Skip</Button>
              <Button onClick={handleNextStep}>
                {currentStep === instructionSteps.length - 1 ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leads Found</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <ul>
              {leads.map((lead, index) => (
                <li key={index} className="mb-2">
                  <div>{lead.name}</div>
                  <div>{lead.address}</div>
                  <div>{lead.telephone}</div>
                  <div>{lead.email}</div>
                  <div>{lead.income}</div>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Input
              placeholder="Enter list name"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleSaveList}>Save List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindLeads;
