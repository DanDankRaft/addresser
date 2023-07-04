var address_components_cache = localStorage.getItem("ADDRESSER_address_components_cache") != null ? JSON.parse(localStorage.getItem("ADDRESSER_address_components_cache")) : {};
var place_id_cache = localStorage.getItem("ADDRESSER_place_id_cache") != null ? JSON.parse(localStorage.getItem("ADDRESSER_place_id_cache")) : {};



const api_url = 'https://nominatim.openstreetmap.org';
const northTexas = {x1: -97.596799, y1: 32.432177, x2: -96.136319, y2: 33.672544 };

/**
 * Gets an address's component (city, county, zip code etc). Tries the local cache, then Nominatim call if that fails.
 * @param {string} address the address to search for
 * @param {string} component the name of the component type in Nominatim formatting.
 * @returns the value of the address component. NOT FOUND if the address is not found.
 */
function get_address_component(address, component) {
  //if the address is already in cache, make sure to find it and add it!
  if(address in place_id_cache) {
    return Promise.resolve(address_components_cache[place_id_cache[address]][component]);
  }

  return new Promise((resolve, reject) => {
    fetch(`${api_url}?q=${address}&addressdetails=1&format=json&limit=1&viewbox=${[northTexas.x1,northTexas.y1,northTexas.x2,northTexas.y2].join(',')}`)
      .then(response => {
        return response.json();
      })
      .then(response => {
        if(response.length > 0) {
          let place_id = response[0].place_id;
          place_id_cache[address] = place_id;
          address_components_cache[place_id] = response[0].address;
          return resolve(response[0].address[component]);
        }
      
        return resolve('NOT FOUND');
      });
  });
}

/**
 * @customfunction CITY
 * @param {string[][][]} address_parts the address to search with
 * @returns {string} the city where the address is located
 */
export function get_city(address_parts) {
  let address = address_parts.flat().join(', ');
  return new Promise((resolve, reject) => {
    get_address_component(address, 'city')
      .then(response => {
        resolve(response);
      })
  });
}

/**
 * Checks if an address contains a city name from a list, then checks OpenStreetMaps if that fails
 * @customfunction CITYFROMLIST
 * @param {string[][]} list 
 * @param {string[][][]} address_parts
 * @returns {string} city where the address is located!
 */
export function get_city_from_list(list, address_parts) {
  let address = address_parts.flat().join(', ').toLowerCase();
  let citylist = list.flat();
  for(let x in citylist) {
    if(citylist[x] != "" && address.includes(citylist[x].toLowerCase())) {
      return citylist[x];
    }
  }

  return get_city(address);
}

/** 
 * Finds an address's county in OpenStreetMaps
 * @customfunction COUNTY
 * @param {string[][][]} address_parts address to search for
 * @returns {string} county where the address is located
 */
export function get_county(address_parts) {
  let address = address_parts.flat().join(', ');
  return new Promise((resolve, reject) => {
    get_address_component(address, 'county')
      .then(response => {
        resolve(response.replace(" County", ""));
      })
  });
}

/**
 * Checks if an address contains a county name from a list, then checks OpenStreetMaps if that fails
 * @customfunction COUNTYFROMLIST
 * @param {string[][]} list 
 * @param {string[][][]} address_parts
 * @returns {string} city where the address is located!
 */
export function get_county_from_list(list, address_parts) {
  let address = address_parts.flat().join(', ').toLowerCase();
  let citylist = list.flat();
  for(let x in citylist) {
    if(citylist[x] != "" && address.includes(citylist[x].toLowerCase())) {
      return citylist[x];
    }
  }

  return get_county(address);
}

/**
 * Returns the first input that does not evaluate to an error or "NOT FOUND"
 * @customfunction FALLBACK
 * @param {string[][][]} inputs
 * @returns the first result that is not 'NOT FOUND' or an error
 */
export function fallback(inputs) {
  let list = inputs.flat();
  for(let x in list) {
    if(list[x] != 'NOT FOUND' && list[x].charAt(0) != '#') {
      return list[x]
    }
  }
  return list[list.length - 1];
}

let uniqueIDs = localStorage.getItem("ADDRESSER_ride_id_cache") != null ? JSON.parse(localStorage.getItem("ADDRESSER_ride_id_cache")) : [];

/**
 * @customfunction CREATE_ID
 * @param dateID
 * @param name
 */
export function createID(dateID, name) {
  let id = dateID.toString() + name;
  if(uniqueIDs.indexOf(id) > -1) {
    return uniqueIDs.indexOf(id) + 1;
  }

  return uniqueIDs.push(id);
}