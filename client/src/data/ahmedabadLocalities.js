// Locality coordinates mapping for Ahmedabad
const localityCoordinates = {
  'Navrangpura': [23.0330, 72.5714],
  'Ellisbridge': [23.0225, 72.5714],
  'Gandhinagar': [23.2156, 72.6369],
  'Maninagar': [23.0125, 72.5850],
  'Vastrapur': [23.0330, 72.5200],
  'Satellite': [23.0400, 72.5100],
  'Bodakdev': [23.0500, 72.5000],
  'Prahladnagar': [23.0300, 72.4900],
  'Ghatlodia': [23.0800, 72.5500],
  'Paldi': [23.0150, 72.5700],
  'CG Road': [23.0330, 72.5714],
  'SG Highway': [23.0400, 72.5100],
  'Sarkhej': [23.0100, 72.5000],
  'Bopal': [23.0500, 72.4800],
  'Thaltej': [23.0600, 72.5200],
  'Memnagar': [23.0400, 72.5400],
  'Naranpura': [23.0700, 72.5600],
  'Chandkheda': [23.1000, 72.5500],
  'Naroda': [23.0800, 72.6000],
  'Isanpur': [23.0000, 72.5800]
};

// Pincode to center coordinates mapping
const pincodeCenters = {
  '380015': [23.0330, 72.5714],
  '380007': [23.0225, 72.5714],
  '380006': [23.2156, 72.6369],
  '380009': [23.0125, 72.5850],
  '380013': [23.0330, 72.5200],
  '380014': [23.0400, 72.5100],
  '380052': [23.0500, 72.5000],
  '380054': [23.0300, 72.4900],
  '380061': [23.0800, 72.5500],
  '380008': [23.0150, 72.5700]
};

export function getUserCoordinates(pincode, locality, latitude, longitude) {
  // If exact coordinates are provided, use them
  if (latitude && longitude) {
    return [parseFloat(latitude), parseFloat(longitude)];
  }
  
  // If locality is provided, try to get coordinates from locality
  if (locality) {
    const localityKey = Object.keys(localityCoordinates).find(
      key => key.toLowerCase() === locality.toLowerCase()
    );
    if (localityKey) {
      return localityCoordinates[localityKey];
    }
  }
  
  // Fallback to pincode center
  if (pincode && pincodeCenters[pincode]) {
    return pincodeCenters[pincode];
  }
  
  // Default to Ahmedabad center
  return [23.0225, 72.5714];
}
